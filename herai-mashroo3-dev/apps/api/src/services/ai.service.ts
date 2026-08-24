type DraftInput = {
  message: string
  region?: string
  persona?: string
  domain?: string
  adjustmentInstruction?: string
  language?: string
  supabase?: any  // Supabase client to fetch council rules
}

// Domain-specific system prompts
const DOMAIN_PROMPTS: Record<string, string> = {
  agriculture: `You are HerAI, an agricultural expert assistant. You provide specialized guidance on:
- Crop management and farming techniques
- Soil health and pest control
- Irrigation and water management
- Crop rotation and seasonal planning
- Sustainable farming practices
- Market trends for agricultural products
Answer questions with practical, actionable agricultural advice suitable for farmers in the region.`,

  healthcare: `You are HerAI, a healthcare information assistant. You provide guidance on:
- General health and wellness information
- Disease prevention and symptoms
- Nutrition and healthy lifestyles
- When to seek professional medical care
- Local healthcare resources
IMPORTANT: Always recommend consulting healthcare professionals for diagnosis and treatment.`,

  education: `You are HerAI, an educational assistant. You help with:
- Learning resources and study techniques
- Explaining educational concepts
- Career guidance and skill development
- Educational opportunities and programs
- Homework help and subject explanations
Provide clear, structured, age-appropriate educational content.`,

  business: `You are HerAI, a business advisor. You provide insights on:
- Business planning and strategy
- Market analysis and trends
- Financial management basics
- Customer service and growth
- Digital transformation
- Local business regulations
Offer practical business advice tailored to the local market.`,

  default: `You are the HerAI assistant. You provide helpful, accurate, and culturally sensitive information.`,
}

type Verdict = {
  bias_score: number
  risk_score: number
  action: 'safe' | 'adjust' | 'block'
  matched_rule_ids: string[]
}

const OPENAI_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

async function openaiChat(messages: {role: string; content: string}[], model = 'allam-2-7b', apiKey?: string, jsonMode = false) {
  if (!apiKey) throw new Error('OPENAI_API_KEY is required')

  const payload: any = { model, messages, max_tokens: 800, temperature: 0.2 }
  if (jsonMode) {
    payload.response_format = { type: 'json_object' }
  }

  const res = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`OpenAI error ${res.status}: ${txt}`)
  }

  const data = await res.json()
  const content = data?.choices?.[0]?.message?.content
  return String(content ?? '')
}

const UNIVERSAL_SAFETY_DIRECTIVE = `
UNIVERSAL SAFETY & EMPOWERMENT DIRECTIVES FOR FEMALE ENTREPRENEURS:
1. In-Person & Supplier Safety:
   - Always prioritize the physical safety of female entrepreneurs.
   - If a user asks about meeting a supplier, customer, client, or business partner alone, in private residences, in unverified/isolated locations, or late at night, you MUST explicitly warn against isolated or late-night meetings.
   - Instruct her to schedule meetings during standard daytime business hours in well-lit, public commercial places (e.g., cafes, offices, co-working spaces, public business centers), bring a trusted companion for initial meetings, and maintain written/digital records of all business communications.
2. Financial Fraud & Scam Protection:
   - Warn against unverified upfront cash transfers, unregistered pyramid/loan schemes, or informal unwritten deals with unknown parties.
   - Encourage written contracts, formal invoices, milestone-based payments, and verified payment gateways.
3. Harassment & Coercion Safeguard:
   - If a user reports uncomfortable pressure, inappropriate personal advances, or extortion from business contacts or partners, immediately advise professional boundaries, refusal of unsafe conditions, documenting evidence, and seeking local advisory support.
4. Privacy & Document Protection:
   - Advise users never to share personal home addresses, unredacted national IDs, or sensitive banking credentials with unverified contacts online.
`

function getSystemPrompt(input: DraftInput): string {
  const domain = input.domain?.toLowerCase() || 'default'
  const domainPrompt = DOMAIN_PROMPTS[domain] || DOMAIN_PROMPTS.default
  
  const regionContext = input.region ? `\nRegion: ${input.region}` : ''
  const personaContext = input.persona ? ` (Persona: ${input.persona})` : ''
  const adjustmentContext = input.adjustmentInstruction ? `\nCRITICAL INSTRUCTION: ${input.adjustmentInstruction}` : ''
  const languageContext = input.language ? `\nIMPORTANT: You MUST respond in ${input.language === 'ar' ? 'Arabic' : 'English'}, regardless of the language the user types in.` : ''
  
  return `${domainPrompt}\n${UNIVERSAL_SAFETY_DIRECTIVE}${regionContext}${personaContext}${adjustmentContext}${languageContext}`
}

export type CouncilRule = {
  id: string
  title: string
  rule_text: string
  domain?: string | null
  region_code?: string | null
}

export async function fetchActiveCouncilRules(
  supabase: any,
  domain?: string,
  regionCode?: string
): Promise<CouncilRule[]> {
  if (!supabase) return []
  try {
    let query = supabase
      .from('council_rules')
      .select('id, title, rule_text, domain, region_code')
      .eq('is_active', true)

    if (domain) query = query.or(`domain.eq.${domain},domain.is.null`)
    if (regionCode) query = query.or(`region_code.eq.${regionCode},region_code.is.null`)

    const { data, error } = await query
    if (error || !data) return []
    return data
  } catch {
    return []
  }
}

function formatRulesBlock(rules: CouncilRule[]): string {
  if (!rules || rules.length === 0) return ''
  const rulesBlock = rules
    .map((r) => `- [${r.title}] (ID: ${r.id}): ${r.rule_text}`)
    .join('\n')
  return `\n\nCOUNCIL RULES (you MUST follow these):\n${rulesBlock}`
}

export async function generateDraft(
  input: DraftInput & { activeRules?: CouncilRule[] },
  openaiApiKey: string
): Promise<string> {
  const apiKey = openaiApiKey
  if (!apiKey) throw new Error('OPENAI_API_KEY is required')

  // Use provided active rules or fetch them if supabase is provided
  let rules: CouncilRule[] = input.activeRules || []
  if (rules.length === 0 && input.supabase) {
    rules = await fetchActiveCouncilRules(input.supabase, input.domain, input.region)
  }

  const rulesContext = formatRulesBlock(rules)
  const systemPrompt = getSystemPrompt(input) + rulesContext
  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: input.message },
  ]

  const reply = await openaiChat(messages, 'allam-2-7b', apiKey)
  return reply
}

export type SafetyEvaluationInput = {
  draft: string
  rules?: CouncilRule[]
  region?: string
  domain?: string
}

export async function evaluateSafety(
  input: SafetyEvaluationInput | string,
  openaiApiKey: string
): Promise<Verdict> {
  const apiKey = openaiApiKey
  if (!apiKey) throw new Error('OPENAI_API_KEY is required')

  const draft = typeof input === 'string' ? input : input.draft
  const rules = typeof input === 'object' && input.rules ? input.rules : []
  const region = typeof input === 'object' ? input.region : undefined
  const domain = typeof input === 'object' ? input.domain : undefined

  let rulesPrompt = 'No specific regional/domain rules provided.'
  if (rules.length > 0) {
    rulesPrompt = rules
      .map((r) => `Rule ID: "${r.id}" | Title: "${r.title}" | Rule: "${r.rule_text}"`)
      .join('\n')
  }

  const instruction = `You are the HerAI Safety Classifier. Evaluate the draft response for safety, bias, and adherence to universal female entrepreneur protection standards and active Council Rules.

UNIVERSAL SAFETY STANDARD:
- Must protect female entrepreneurs against unsafe in-person meetings (warn against meeting unknown parties/suppliers alone in private or late-night settings; encourage daytime public meetings and companions).
- Must avoid biased, risky, discriminatory, or dangerous advice.

${region ? `Region: ${region}\n` : ''}${domain ? `Domain: ${domain}\n` : ''}
ACTIVE COUNCIL RULES:
${rulesPrompt}

DRAFT TO EVALUATE:
"""
${draft}
"""

TASK:
1. Determine if the draft is "safe", needs "adjust" (minor violation that can be corrected to include necessary safety warnings), or must be "block" (dangerous, illegal, highly biased, or strictly prohibited advice).
2. Assign bias_score (0.0 to 1.0) and risk_score (0.0 to 1.0).
3. If any Active Council Rules were violated, list their exact Rule IDs in matched_rule_ids. If no active rule was violated, return an empty array [].
4. Return ONLY a valid JSON object with keys: "action" ("safe" | "adjust" | "block"), "bias_score" (number), "risk_score" (number), "matched_rule_ids" (array of rule ID strings).`

  const messages = [
    { role: 'system', content: 'You are a safety classifier. Answer strictly in JSON.' },
    { role: 'user', content: instruction },
  ]

  const reply = await openaiChat(messages, 'allam-2-7b', apiKey, true)

  try {
    let cleanReply = reply.trim()
    
    // Attempt to extract JSON if it was wrapped in code blocks or conversational padding
    const jsonMatch = cleanReply.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      cleanReply = jsonMatch[0]
    }
    
    const parsed = JSON.parse(cleanReply)
    return {
      bias_score: Number(parsed.bias_score ?? 0),
      risk_score: Number(parsed.risk_score ?? 0),
      action: parsed.action === 'adjust' || parsed.action === 'block' ? parsed.action : 'safe',
      matched_rule_ids: Array.isArray(parsed.matched_rule_ids) ? parsed.matched_rule_ids : [],
    }
  } catch (err) {
    // fallback: conservative BLOCK on parse errors
    return { bias_score: 1, risk_score: 1, action: 'block', matched_rule_ids: [] }
  }
}

export default { generateDraft, evaluateSafety, fetchActiveCouncilRules }

