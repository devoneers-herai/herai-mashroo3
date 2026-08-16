import { evaluateSafety } from './ai.service'

export async function evaluate(draft: string, context: any, openaiApiKey: string) {
  // context can include region, persona, rules, etc.
  return evaluateSafety(draft, openaiApiKey)
}

export default { evaluate }
