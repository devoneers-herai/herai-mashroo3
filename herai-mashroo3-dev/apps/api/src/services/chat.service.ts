import { generateDraft, evaluateSafety } from './ai.service'
import { scrub } from './scrub.service'
import { getRegionConfig } from './region.service'

type ChatInput = { message: string; region_code?: string; persona?: string; domain_scope?: string; user_id: string; language?: string }

export async function handleChatLogic(input: ChatInput, deps: { supabase: any; openaiKey: string }) {
  const { supabase, openaiKey } = deps
  const regionCode = input.region_code || 'EG'
  const domainScope = input.domain_scope || undefined

  // 1. Resolve Region Config at runtime
  const regionConfig = getRegionConfig(regionCode)
  const configVersion = regionConfig.version

  // 2. Scrub PII
  const scrubbed = await scrub(input.message)

  let finalResponse = ''
  let verdict: any = null
  const verdictsToSave: any[] = []
  
  // Wrap AI calls in try/catch to ensure errors trigger a BLOCK
  try {
    // 3. Generate initial draft
    let draft = await generateDraft({ message: scrubbed, region: regionCode, persona: input.persona, domain: domainScope, language: input.language }, openaiKey)
    
    // 4. Safety evaluation (initial)
    verdict = await evaluateSafety(draft, openaiKey)
    verdict.draft_response = draft // Save the original draft for this verdict
    verdictsToSave.push(verdict)

    // 5. ADJUST Re-check Flow
    if (verdict.action === 'adjust') {
      // Re-generate draft with adjustment instruction
      draft = await generateDraft({ 
        message: scrubbed, 
        region: regionCode, 
        persona: input.persona, 
        domain: domainScope,
        language: input.language,
        adjustmentInstruction: 'Ensure the response completely avoids any biased or high-risk language.' 
      }, openaiKey)
      
      // Evaluate the new draft
      verdict = await evaluateSafety(draft, openaiKey)
      verdict.draft_response = draft // Save the adjusted draft for this verdict
      verdictsToSave.push(verdict)
    }

    finalResponse = draft
    
    // 6. Handle BLOCK
    if (verdict.action === 'block') {
      finalResponse = "I cannot provide a response to that request due to safety policies."
    }
  } catch (err) {
    console.error('AI pipeline error:', err)
    // Fallback block verdict
    verdict = {
      action: 'block',
      bias_score: 1,
      risk_score: 1,
      matched_rule_ids: [],
      draft_response: '',
    }
    finalResponse = "I cannot provide a response to that request due to safety policies."
    verdictsToSave.push(verdict)
  }

  // 7. Persist to DB
  try {
    const { data: conversationData, error: convError } = await supabase.from('conversations').insert([{
      user_id: input.user_id,
      region_code: regionCode,
      region_config_version: configVersion,
      domain_scope: domainScope || null,
      scrubbed_message: scrubbed,
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
      draft_response: v.draft_response,
      final_response: finalResponse
    }))

    await supabase.from('verdicts').insert(verdictsRecords)
  } catch (e) {
    console.warn('persist warning', e)
  }

  return { response: finalResponse, safety_flag: verdict.action, verdict }
}

export default { handleChatLogic }
