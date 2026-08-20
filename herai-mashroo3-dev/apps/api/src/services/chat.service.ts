import { generateDraft, evaluateSafety } from './ai.service'
import { scrub } from './scrub.service'
import { getRegionConfig } from './region.service'

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
  const domainScope =
    input.domain_scope || undefined

  // 1. Resolve Region Config
  const regionConfig = getRegionConfig(regionCode)
  const configVersion = regionConfig.version

  // 2. Scrub PII
  const scrubbed = await scrub(input.message)

  let finalResponse = ''
  let verdict: any = null
  const verdictsToSave: any[] = []

  // Wrap AI calls in try/catch.
  try {
    // 3. Generate initial draft
    let draft = await generateDraft(
      {
        message: scrubbed,
        region: regionCode,
        persona: input.persona,
        domain: domainScope,
        language: input.language,
        supabase,
      },
      openaiKey
    )

    // 4. Safety evaluation
    verdict = await evaluateSafety(
      draft,
      openaiKey
    )

    verdict.draft_response = draft

    verdictsToSave.push(verdict)

    // 5. ADJUST Re-check Flow
    if (verdict.action === 'adjust') {
      draft = await generateDraft(
        {
          message: scrubbed,
          region: regionCode,
          persona: input.persona,
          domain: domainScope,
          language: input.language,
          supabase,
          adjustmentInstruction:
            'Ensure the response completely avoids any biased or high-risk language.',
        },
        openaiKey
      )

      verdict = await evaluateSafety(
        draft,
        openaiKey
      )

      verdict.draft_response = draft

      verdictsToSave.push(verdict)
    }

    finalResponse = draft

    // 6. Handle BLOCK
    if (verdict.action === 'block') {
      finalResponse =
        'I cannot provide a response to that request due to safety policies.'
    }
  } catch (err) {
    console.error(
      'AI pipeline error:',
      err
    )

    verdict = {
      action: 'block',
      bias_score: 1,
      risk_score: 1,
      matched_rule_ids: [],
      draft_response: '',
    }

    finalResponse =
      'I cannot provide a response to that request due to safety policies.'

    verdictsToSave.push(verdict)
  }

  /*
   * ============================================================
   * 7. PERSIST CONVERSATION
   * ============================================================
   *
   * THIS IS THE IMPORTANT FIX.
   *
   * If conversation_id exists:
   *   -> use the existing conversation.
   *
   * If conversation_id does NOT exist:
   *   -> create a new conversation.
   */

  let conversationId =
    input.conversation_id || null

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

      if (
        existingConversationError ||
        !existingConversation
      ) {
        throw new Error(
          'Conversation not found or does not belong to this user'
        )
      }
    } else {
      // FIRST MESSAGE OF A NEW CHAT.
      // Only here do we create a new conversation.
      const {
        data: conversationData,
        error: convError,
      } = await supabase
        .from('conversations')
        .insert([
          {
            user_id: input.user_id,
            region_code: regionCode,
            region_config_version:
              configVersion,
            domain_scope:
              domainScope || null,
            scrubbed_message: scrubbed,
          },
        ])
        .select()
        .single()

      if (convError) {
        throw convError
      }

      conversationId =
        conversationData.id
    }

    /*
     * For an existing conversation, we DO NOT insert another
     * conversation row.
     *
     * The original first message stays in:
     * conversations.scrubbed_message
     *
     * Each new assistant response is stored in verdicts
     * using the same conversation_id.
     */

    const verdictsRecords =
      verdictsToSave.map((v) => ({
        conversation_id: conversationId,
        action: v.action,
        bias_score: v.bias_score,
        risk_score: v.risk_score,
        matched_rule_ids:
          v.matched_rule_ids,
        region_config_version:
          configVersion,
        draft_response:
          v.draft_response,
        final_response:
          finalResponse,
      }))

    if (verdictsRecords.length > 0) {
      const {
        error: verdictError,
      } = await supabase
        .from('verdicts')
        .insert(verdictsRecords)

      if (verdictError) {
        throw verdictError
      }
    }
  } catch (e) {
    console.warn(
      'persist warning',
      e
    )
  }

  /*
   * Return the conversation ID to the frontend.
   *
   * The frontend needs this ID so that the next message
   * can continue the same conversation.
   */
  return {
    response: finalResponse,
    conversation_id: conversationId,
  }
}

export default {
  handleChatLogic,
}