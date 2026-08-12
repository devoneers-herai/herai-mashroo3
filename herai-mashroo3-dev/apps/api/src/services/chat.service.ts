import { generateDraft, evaluateSafety } from './ai.service'

type ChatInput = { message: string; region?: string; persona?: string }

export async function handleChatLogic(input: ChatInput, deps: { supabase: any; openaiKey: string }) {
  // 1. scrub
  // 2. generate draft
  // 3. evaluate safety
  // 4. persist verdict + conversation

  const { supabase, openaiKey } = deps

  // simple scrub placeholder
  const scrubbed = input.message.replace(/\b\S+@\S+\.\S+\b/g, '[REDACTED]')

  const draft = await generateDraft({ message: scrubbed, region: input.region, persona: input.persona }, openaiKey)
  const verdict = await evaluateSafety(draft, openaiKey)

  // persist conversation and verdict (simplified)
  try {
    await supabase.from('conversations').insert([{
      region: input.region || 'EG',
      persona: input.persona || null,
      message: scrubbed,
      draft,
    }])

    await supabase.from('verdicts').insert([{
      draft,
      action: verdict.action,
      bias_score: verdict.bias_score,
      risk_score: verdict.risk_score,
      matched_rule_ids: verdict.matched_rule_ids,
    }])
  } catch (e) {
    console.warn('persist warning', e)
  }

  return { response: draft, safety_flag: verdict.action, verdict }
}

export default { handleChatLogic }
