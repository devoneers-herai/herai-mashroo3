import { evaluateSafety } from './ai.service'

export async function evaluate(
  draft: string,
  context: any,
  openaiApiKey?: string,
  backupApiKey?: string
) {
  // context can include region, persona, rules, etc.
  return evaluateSafety(draft, openaiApiKey, backupApiKey)
}

export default { evaluate }
