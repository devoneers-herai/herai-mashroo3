type DraftInput = {
  message: string
  region?: string
  persona?: string
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

export async function generateDraft(input: DraftInput, openaiApiKey: string): Promise<string> {
  const apiKey = openaiApiKey
  if (!apiKey) throw new Error('OPENAI_API_KEY is required')

  const messages = [
    { role: 'system', content: `You are the HerAI assistant. Persona: ${input.persona ?? 'default'}. Region: ${input.region ?? 'default'}.` },
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
