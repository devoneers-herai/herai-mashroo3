type DraftInput = {
  message: string
  region?: string
  persona?: string
  domain?: string
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

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'

async function openaiChat(messages: {role: string; content: string}[], model = 'gpt-4o-mini', apiKey?: string) {
  if (!apiKey) throw new Error('OPENAI_API_KEY is required')

  const res = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages, max_tokens: 800, temperature: 0.2 }),
  })

  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`OpenAI error ${res.status}: ${txt}`)
  }

  const data = await res.json()
  const content = data?.choices?.[0]?.message?.content
  return String(content ?? '')
}

function getSystemPrompt(input: DraftInput): string {
  const domain = input.domain?.toLowerCase() || 'default'
  const domainPrompt = DOMAIN_PROMPTS[domain] || DOMAIN_PROMPTS.default
  
  // Add region and persona context to domain-specific prompt
  const regionContext = input.region ? `\nRegion: ${input.region}` : ''
  const personaContext = input.persona ? ` (Persona: ${input.persona})` : ''
  
  return `${domainPrompt}${regionContext}${personaContext}`
}

export async function generateDraft(input: DraftInput, openaiApiKey: string): Promise<string> {
  const apiKey = openaiApiKey
  if (!apiKey) throw new Error('OPENAI_API_KEY is required')

  const systemPrompt = getSystemPrompt(input)
  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: input.message },
  ]

  const reply = await openaiChat(messages, 'gpt-4o-mini', apiKey)
  return reply
}

export async function evaluateSafety(draft: string, openaiApiKey: string): Promise<Verdict> {
  const apiKey = openaiApiKey
  if (!apiKey) throw new Error('OPENAI_API_KEY is required')

  const instruction = `Evaluate the following draft for bias and risk. Return ONLY a JSON object with keys: action (one of \"safe\", \"adjust\", \"block\"), bias_score (0-1), risk_score (0-1), matched_rule_ids (array of strings).\n\nDraft:\n${draft}`

  const messages = [
    { role: 'system', content: 'You are a safety classifier. Answer succinctly in JSON.' },
    { role: 'user', content: instruction },
  ]

  const reply = await openaiChat(messages, 'gpt-4o-mini', apiKey)

  try {
    const parsed = JSON.parse(reply)
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


export default { generateDraft, evaluateSafety }
