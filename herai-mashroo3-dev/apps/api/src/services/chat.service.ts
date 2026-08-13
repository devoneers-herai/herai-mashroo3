import { generateDraft, evaluateSafety } from './ai.service'
import { scrub } from './scrub.service'
import { getRegionConfig } from './region.service'

type ChatInput = { message: string; region_code?: string; persona?: string; domain_scope?: string; user_id: string }

export async function handleChatLogic(input: ChatInput, deps: { supabase: any; openaiKey: string }) {
  const { supabase, openaiKey } = deps
  const regionCode = input.region_code || 'EG'
  const domainScope = input.domain_scope || undefined

  // 1. Resolve Region Config at runtime
  const regionConfig = getRegionConfig(regionCode)
  const configVersion = regionConfig.version

  // 2. Scrub PII
  const scrubbed = await scrub(input.message)

  // 3. Generate initial draft
  let draft = await generateDraft({ message: scrubbed, region: regionCode, persona: input.persona, domain: domainScope }, openaiKey)
  
  // 4. Safety evaluation (initial)
  let verdict = await evaluateSafety(draft, openaiKey)
  const verdictsToSave = [verdict]

  // 5. ADJUST Re-check Flow
  if (verdict.action === 'adjust') {
    // Re-generate draft with adjustment instruction
    draft = await generateDraft({ 
      message: scrubbed, 
      region: regionCode, 
      persona: input.persona, 
      domain: domainScope,
      adjustmentInstruction: 'Ensure the response completely avoids any biased or high-risk language.' 
    }, openaiKey)
    
    // Evaluate the new draft
    verdict = await evaluateSafety(draft, openaiKey)
    verdictsToSave.push(verdict)
  }

  // 6. Handle BLOCK
  let finalResponse = draft
  if (verdict.action === 'block') {
    finalResponse = "I cannot provide a response to that request due to safety policies."
  }

  // 7. Persist to DB
  try {
    const { data: conversationData, error: convError } = await supabase.from('conversations').insert([{
      user_id: input.user_id,
      region_code: regionCode,
      region_config_version: configVersion,
      persona: input.persona || null,
      domain_scope: domainScope || null,
      scrubbed_message: scrubbed,
      draft: finalResponse,
    }]).select().single()

    if (convError) throw convError

    const conversationId = conversationData.id

    const verdictsRecords = verdictsToSave.map(v => ({
      conversation_id: conversationId,
      action: v.action,
      bias_score: v.bias_score,
      risk_score: v.risk_score,
      matched_rule_ids: v.matched_rule_ids,
      region_config_version: configVersion,
      draft_response: draft,
      final_response: finalResponse
    }))

    await supabase.from('verdicts').insert(verdictsRecords)
  } catch (e) {
    console.warn('persist warning', e)
  }

  return { response: finalResponse, safety_flag: verdict.action, verdict }
}

export default { handleChatLogic }
