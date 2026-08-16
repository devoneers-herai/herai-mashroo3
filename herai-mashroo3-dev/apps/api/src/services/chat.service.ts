import { generateDraft, evaluateSafety } from './ai.service'
import { scrub } from './scrub.service'
import { getRegionConfig } from './region.service'

type ChatInput = {
  message: string
  region_code?: string
  persona?: string
  domain_scope?: string
  user_id: string
  conversation_id?: string
  language?: string
}

/**
 * Creates a short, readable conversation title from the user's
 * first message.
 *
 * Example:
 * "How should I price my handmade candles?"
 * -> "How should I price my handmade candles?"
 *
 * Long messages are shortened to keep the sidebar clean.
 */
function createConversationTitle(message: string): string {
  const cleaned = message
    .replace(/\s+/g, ' ')
    .replace(/^[\s"'“”‘’]+|[\s"'“”‘’]+$/g, '')
    .trim()

  if (!cleaned) {
    return 'New conversation'
  }

  const maxLength = 55

  if (cleaned.length <= maxLength) {
    return cleaned
  }

  const shortened = cleaned.slice(0, maxLength)

  // Try not to cut in the middle of a word.
  const lastSpace = shortened.lastIndexOf(' ')

  if (lastSpace > 25) {
    return `${shortened.slice(0, lastSpace)}...`
  }

  return `${shortened}...`
}

export async function handleChatLogic(
  input: ChatInput,
  deps: { supabase: any; openaiKey: string }
) {
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

  // 3. Generate + safety pipeline
  try {
    let draft = await generateDraft(
      {
        message: scrubbed,
        region: regionCode,
        persona: input.persona,
        domain: domainScope,
        language: input.language,
      },
      openaiKey
    )

    // 4. Initial safety evaluation
    verdict = await evaluateSafety(draft, openaiKey)
    verdict.draft_response = draft
    verdictsToSave.push(verdict)

    // 5. ADJUST re-check flow
    if (verdict.action === 'adjust') {
      draft = await generateDraft(
        {
          message: scrubbed,
          region: regionCode,
          persona: input.persona,
          domain: domainScope,
          language: input.language,
          adjustmentInstruction:
            'Ensure the response completely avoids any biased or high-risk language.',
        },
        openaiKey
      )

      verdict = await evaluateSafety(draft, openaiKey)
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
    console.error('AI pipeline error:', err)

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

  // 7. Get or create the conversation
  let conversationId = input.conversation_id

  try {
    if (conversationId) {
      // Make sure this conversation belongs to the authenticated user.
      const { data: existingConversation, error: conversationError } =
        await supabase
          .from('conversations')
          .select('id')
          .eq('id', conversationId)
          .eq('user_id', input.user_id)
          .single()

      if (conversationError || !existingConversation) {
        throw new Error('Conversation not found')
      }
    } else {
      // No conversation_id means this is a NEW chat.
      //
      // Use the first user message as the conversation title.
      const conversationTitle = createConversationTitle(input.message)

      const { data: conversationData, error: convError } =
        await supabase
          .from('conversations')
          .insert([
            {
              user_id: input.user_id,
              title: conversationTitle,
              region_code: regionCode,
              region_config_version: configVersion,
              domain_scope: domainScope || null,
            },
          ])
          .select('id, title')
          .single()

      if (convError) throw convError

      conversationId = conversationData.id
    }

    // 8. Save the USER message
    const { error: userMessageError } = await supabase
      .from('messages')
      .insert([
        {
          conversation_id: conversationId,
          role: 'user',
          content: input.message,
        },
      ])

    if (userMessageError) throw userMessageError

    // 9. Save the ASSISTANT message
    const { error: assistantMessageError } = await supabase
      .from('messages')
      .insert([
        {
          conversation_id: conversationId,
          role: 'assistant',
          content: finalResponse,
        },
      ])

    if (assistantMessageError) throw assistantMessageError

    // 10. Save safety verdicts
    const verdictsRecords = verdictsToSave.map((v) => ({
      conversation_id: conversationId,
      action: v.action,
      bias_score: v.bias_score,
      risk_score: v.risk_score,
      matched_rule_ids: v.matched_rule_ids || [],
      region_config_version: configVersion,
      draft_response: v.draft_response || '',
      final_response: finalResponse,
    }))

    if (verdictsRecords.length > 0) {
      const { error: verdictError } = await supabase
        .from('verdicts')
        .insert(verdictsRecords)

      if (verdictError) throw verdictError
    }
  } catch (e) {
    console.error('PERSIST ERROR:', e)
    throw e
  }

  return {
    response: finalResponse,
    safety_flag: verdict?.action,
    verdict,
    conversation_id: conversationId,
  }
}

export default { handleChatLogic }