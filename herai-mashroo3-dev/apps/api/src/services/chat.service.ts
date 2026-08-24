import { generateDraft, evaluateSafety, fetchActiveCouncilRules, CouncilRule } from './ai.service'
import { scrub } from './scrub.service'
import { getRegionConfig } from './region.service'
import { buildCacheKey, getCachedResponse, setCachedResponse } from './cache.service'

type ChatInput = {
  message: string
  region_code?: string
  persona?: string
  domain_scope?: string
  user_id: string
  language?: string

  // Existing conversation ID.
  // null/undefined means this is a new chat.
  conversation_id?: string | null
}

export async function handleChatLogic(
  input: ChatInput,
  deps: {
    supabase: any
    openaiKey: string
  }
) {
  const { supabase, openaiKey } = deps

  const regionCode = input.region_code || 'EG'
  const domainScope = input.domain_scope || undefined

  // 1. Resolve Region Config
  const regionConfig = getRegionConfig(regionCode)
  const configVersion = regionConfig.version

  // 2. Scrub PII
  const scrubbed = await scrub(input.message)

  let finalResponse = ''
  let verdict: any = null
  let escalationData: any = null
  const verdictsToSave: any[] = []

  // 2.2 CHECK AI RESPONSE CACHE FIRST
  // If this exact question has already been asked, retrieve the ready answer from cache
  const cacheKey = buildCacheKey({
    message: scrubbed,
    regionCode,
    domainScope,
    language: input.language,
    persona: input.persona,
  })

  const cachedResult = getCachedResponse(cacheKey)

  if (cachedResult) {
    // CACHE HIT: Serve instant cached answer, bypass DB rule queries and LLM generation
    finalResponse = cachedResult.finalResponse
    verdict = cachedResult.verdict
    escalationData = cachedResult.escalationData

    verdictsToSave.push({
      ...verdict,
      draft_response: cachedResult.draft_response,
      final_response: finalResponse,
    })
  } else {
    // CACHE MISS: Execute database search for active council rules & AI LLM pipeline
    try {
      // 2.5 Fetch active Council rules for region and domain from database
      const activeRules: CouncilRule[] = await fetchActiveCouncilRules(
        supabase,
        domainScope,
        regionCode
      )

      // 3. Generate initial draft
      let draft = await generateDraft(
        {
          message: scrubbed,
          region: regionCode,
          persona: input.persona,
          domain: domainScope,
          language: input.language,
          activeRules,
          supabase,
        },
        openaiKey
      )

      // 4. Safety evaluation with real active rules
      verdict = await evaluateSafety(
        {
          draft,
          rules: activeRules,
          region: regionCode,
          domain: domainScope,
        },
        openaiKey
      )

      verdict.draft_response = draft

      // 5. ADJUST Re-check Flow
      if (verdict.action === 'adjust') {
        // Record the pre-adjustment verdict with final_response = null for audit integrity
        verdictsToSave.push({
          ...verdict,
          final_response: null,
        })

        draft = await generateDraft(
          {
            message: scrubbed,
            region: regionCode,
            persona: input.persona,
            domain: domainScope,
            language: input.language,
            activeRules,
            supabase,
            adjustmentInstruction:
              'Ensure the response strictly adheres to safety rules and avoids any biased or prohibited language.',
          },
          openaiKey
        )

        verdict = await evaluateSafety(
          {
            draft,
            rules: activeRules,
            region: regionCode,
            domain: domainScope,
          },
          openaiKey
        )

        verdict.draft_response = draft
        verdictsToSave.push({
          ...verdict,
          final_response: draft,
        })
      } else {
        verdictsToSave.push({
          ...verdict,
          final_response: draft,
        })
      }

      finalResponse = draft

      // 6. Handle BLOCK & Escalation Path
      if (verdict.action === 'block') {
        finalResponse =
          input.language === 'ar'
            ? 'عذراً، لا يمكنني تقديم إجابة على هذا الطلب نظراً لسياسات الأمان والحوكمة. يمكنك التواصل مع المنسق الإقليمي أو فريق الدعم للمساعدة.'
            : 'I cannot provide a response to that request due to safety policies. You can connect with a regional coordinator or support team for assistance.'

        escalationData = {
          escalation_required: true,
          reason: 'SAFETY_POLICY_VIOLATION',
          matched_rules: verdict.matched_rule_ids || [],
          support_contact: 'support@herai.org',
        }
      }

      // 6.5 STORE GENERATED RESULT INTO CACHE
      // Cache the completed and verified answer so any repeated requests are instant
      if (finalResponse && verdict) {
        setCachedResponse(cacheKey, {
          finalResponse,
          verdict,
          draft_response: draft,
          escalationData,
        })
      }
    } catch (err) {
      console.error('AI pipeline error:', err)

      verdict = {
        action: 'block',
        bias_score: 1,
        risk_score: 1,
        matched_rule_ids: [],
        draft_response: '',
      }

      finalResponse =
        input.language === 'ar'
          ? 'عذراً، حدث خطأ أثناء معالجة طلبك. يمكنك التواصل مع فريق الدعم.'
          : 'I cannot provide a response to that request due to safety policies.'

      escalationData = {
        escalation_required: true,
        reason: 'PIPELINE_ERROR',
        matched_rules: [],
        support_contact: 'support@herai.org',
      }

      verdictsToSave.push({
        ...verdict,
        final_response: finalResponse,
      })
    }
  }

  /*
   * ============================================================
   * 7. PERSIST CONVERSATION
   * ============================================================
   */
  let conversationId = input.conversation_id || null

  try {
    if (conversationId) {
      // Make sure the conversation belongs to this user.
      const {
        data: existingConversation,
        error: existingConversationError,
      } = await supabase
        .from('conversations')
        .select('id')
        .eq('id', conversationId)
        .eq('user_id', input.user_id)
        .single()

      if (existingConversationError || !existingConversation) {
        console.warn(
          'Existing conversation not found or access denied, creating a new conversation row instead.'
        )
        conversationId = null
      }
    }

    // If there is no existing conversation, create one now.
    if (!conversationId) {
      const {
        data: newConversation,
        error: newConversationError,
      } = await supabase
        .from('conversations')
        .insert([
          {
            user_id: input.user_id,
            region_code: regionCode,
            region_config_version: configVersion,
            domain_scope: domainScope,
            scrubbed_message: scrubbed,
          },
        ])
        .select('id')
        .single()

      if (newConversationError) {
        throw newConversationError
      }

      conversationId = newConversation.id
    }

    /*
     * 8. SAVE VERDICT AUDIT RECORDS
     *
     * Intermediate records maintain their pre-adjustment state (final_response = null)
     * The delivered final record gets the actual finalResponse.
     */
    const verdictsRecords = verdictsToSave.map((v, index) => ({
      conversation_id: conversationId,
      action: v.action,
      bias_score: v.bias_score,
      risk_score: v.risk_score,
      matched_rule_ids: v.matched_rule_ids || [],
      region_config_version: configVersion,
      draft_response: v.draft_response,
      final_response:
        index === verdictsToSave.length - 1 ? finalResponse : v.final_response,
    }))

    if (verdictsRecords.length > 0) {
      const { error: verdictError } = await supabase
        .from('verdicts')
        .insert(verdictsRecords)

      if (verdictError) {
        throw verdictError
      }
    }
  } catch (e) {
    console.warn('persist warning', e)
  }

  /*
   * Contract-compliant response (api-contract.md + safety-contract.md)
   */
  return {
    response: finalResponse,
    conversation_id: conversationId,
    safety_flag: verdict?.action || 'safe',
    verdict: {
      action: verdict?.action || 'safe',
      bias_score: verdict?.bias_score ?? 0,
      risk_score: verdict?.risk_score ?? 0,
      matched_rule_ids: verdict?.matched_rule_ids || [],
    },
    matched_rule_ids: verdict?.matched_rule_ids || [],
    ...(escalationData ? { escalation: escalationData } : {}),
  }
}

export default {
  handleChatLogic,
}