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
  const lastSpace = shortened.lastIndexOf(' ')

  if (lastSpace > 25) {
    return `${shortened.slice(0, lastSpace)}...`
  }

  return `${shortened}...`
}

const BLOCKED_RESPONSE =
  'I cannot provide a response to that request due to safety policies.'

export async function handleChatLogic(
  input: ChatInput,
  deps: { supabase: any; openaiKey: string }
) {
  const { supabase, openaiKey } = deps

  const regionCode = input.region_code || 'EG'
  const domainScope = input.domain_scope || undefined

  // 1. Resolve region configuration
  const regionConfig = getRegionConfig(regionCode)
  const configVersion = regionConfig.version

  // 2. Scrub PII before sending the message to the LLM
  const scrubbed = await scrub(input.message)

  let finalResponse = ''
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

    // First safety evaluation
    let verdict = await evaluateSafety(draft, openaiKey)

    verdictsToSave.push({
      ...verdict,
      draft_response: draft,
    })

    // SAFE:
    // The draft passed the safety check and can become the
    // user-facing response.
    if (verdict.action === 'safe') {
      finalResponse = draft
    }

    // ADJUST:
    // This is an INTERNAL safety operation.
    // The user/frontend never receives the original draft
    // or the "adjust" action.
    else if (verdict.action === 'adjust') {
      draft = await generateDraft(
        {
          message: scrubbed,
          region: regionCode,
          persona: input.persona,
          domain: domainScope,
          language: input.language,
          adjustmentInstruction:
            'Rewrite the response to completely avoid biased, discriminatory, unsafe, or high-risk language. Return only the revised user-facing answer.',
        },
        openaiKey
      )

      // The adjusted draft MUST be evaluated again.
      verdict = await evaluateSafety(draft, openaiKey)

      verdictsToSave.push({
        ...verdict,
        draft_response: draft,
      })

      // Only the second SAFE result can reach the user.
      if (verdict.action === 'safe') {
        finalResponse = draft
      } else {
        finalResponse = BLOCKED_RESPONSE
      }
    }

    // BLOCK:
    // Never expose the generated draft to the frontend.
    else {
      finalResponse = BLOCKED_RESPONSE
    }
  } catch (err) {
    console.error('AI pipeline error:', err)

    // Fail closed if the AI/safety pipeline fails.
    const fallbackVerdict = {
      action: 'block' as const,
      bias_score: 1,
      risk_score: 1,
      matched_rule_ids: [],
      draft_response: '',
    }

    finalResponse = BLOCKED_RESPONSE

    verdictsToSave.push(fallbackVerdict)
  }

  // 4. Get or create the conversation
  let conversationId = input.conversation_id

  try {
    if (conversationId) {
      // Conversation MUST belong to the authenticated user.
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

      if (convError) {
        throw convError
      }

      conversationId = conversationData.id
    }

    // 5. Save USER message
    const { error: userMessageError } = await supabase
      .from('messages')
      .insert([
        {
          conversation_id: conversationId,
          role: 'user',
          content: input.message,
        },
      ])

    if (userMessageError) {
      throw userMessageError
    }

    // 6. Save ONLY the final user-facing response
    const { error: assistantMessageError } = await supabase
      .from('messages')
      .insert([
        {
          conversation_id: conversationId,
          role: 'assistant',
          content: finalResponse,
        },
      ])

    if (assistantMessageError) {
      throw assistantMessageError
    }

    // 7. Save safety audit records internally.
    //
    // draft_response, scores, actions, and matched rules remain
    // server/database-side and are never returned to the frontend.
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

      if (verdictError) {
        throw verdictError
      }
    }
  } catch (e) {
    console.error('PERSIST ERROR:', e)
    throw e
  }

  // IMPORTANT:
  // The API exposes ONLY the final user-facing response and
  // conversation identifier.
  //
  // No draft_response
  // No verdict
  // No bias_score
  // No risk_score
  // No matched_rule_ids
  // No safety action/flag
  //
  // All Safety Brain operations remain internal.
  return {
    response: finalResponse,
    conversation_id: conversationId,
  }
}

export default { handleChatLogic }