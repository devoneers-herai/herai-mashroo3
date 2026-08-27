import { Router, Request, Response, NextFunction } from 'express'
import { handleChatLogic } from '../services/chat.service'
import authMiddleware from '../middleware/auth.middleware'

type ServiceRequest = Request & {
  services?: {
    supabase?: any
    OPENAI_API_KEY?: string
    BACKUP_AI_KEY?: string
    GROQ_API_KEY?: string
    GROK_API_KEY?: string
  }
  user?: any
}

const router = Router()

// POST /api/chat - send a message
router.post(
  '/',
  authMiddleware,
  async (
    req: ServiceRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const {
        message,
        region_code,
        domain_scope,
        persona,
        language,
        conversation_id,
      } = req.body

      const { supabase, OPENAI_API_KEY, BACKUP_AI_KEY, GROQ_API_KEY, GROK_API_KEY } =
        req.services || {}
      const user_id = req.user?.id

      if (!user_id) {
        res.status(401).json({ error: 'Unauthorized' })
        return
      }

      if (!message || typeof message !== 'string') {
        res.status(400).json({ error: 'Message is required' })
        return
      }

      const output = await handleChatLogic(
        {
          message,
          region_code,
          domain_scope,
          persona,
          user_id,
          language,
          conversation_id,
        },
        {
          supabase,
          openaiKey: OPENAI_API_KEY as string,
          backupKey: (BACKUP_AI_KEY || GROQ_API_KEY || GROK_API_KEY) as string,
        }
      )

      res.json(output)
    } catch (err: any) {
      console.error('chat error', err)
      res.status(500).json({
        error: String(err.message || err),
      })
    }
  }
)

// GET /api/chat/history
router.get(
  '/history',
  authMiddleware,
  async (req: ServiceRequest, res: Response) => {
    try {
      const { supabase } = req.services || {}
      const user_id = req.user?.id

      if (!user_id || !supabase) {
        res.status(401).json({ error: 'Unauthorized' })
        return
      }

      const { data, error } = await supabase
        .from('conversations')
        .select(
          'id, scrubbed_message, created_at, messages(id, role, content, created_at), verdicts(id, final_response, created_at)'
        )
        .eq('user_id', user_id)
        .order('created_at', { ascending: true })

      if (error) throw error

      const formattedMessages: {
        id: number
        role: 'user' | 'assistant'
        content: string
      }[] = []

      data.forEach((conv: any, index: number) => {
        const sortedMessages = [...(conv.messages || [])].sort(
          (a: any, b: any) =>
            new Date(a.created_at).getTime() -
            new Date(b.created_at).getTime()
        )

        if (sortedMessages.length > 0) {
          sortedMessages.forEach((m: any, mIdx: number) => {
            formattedMessages.push({
              id: new Date(m.created_at).getTime() || index * 100 + mIdx + 1,
              role: m.role,
              content: m.content,
            })
          })
        } else {
          // Legacy fallback for conversations before messages table was populated
          const baseId =
            new Date(conv.created_at).getTime() || index * 2

          if (conv.scrubbed_message) {
            formattedMessages.push({
              id: baseId,
              role: 'user',
              content: conv.scrubbed_message,
            })
          }

          if (conv.verdicts && conv.verdicts.length > 0) {
            const sortedVerdicts = [...conv.verdicts].sort(
              (a: any, b: any) =>
                new Date(a.created_at).getTime() -
                new Date(b.created_at).getTime()
            )

            sortedVerdicts.forEach((verdict: any, verdictIndex: number) => {
              if (verdict.final_response) {
                formattedMessages.push({
                  id: baseId + verdictIndex + 1,
                  role: 'assistant',
                  content: verdict.final_response,
                })
              }
            })
          }
        }
      })

      res.json({
        messages: formattedMessages,
      })
    } catch (err: any) {
      console.error('chat history error', err)
      res.status(500).json({
        error: String(err.message || err),
      })
    }
  }
)

// GET /api/chat/conversations
router.get(
  '/conversations',
  authMiddleware,
  async (req: ServiceRequest, res: Response) => {
    try {
      const { supabase } = req.services || {}
      const user_id = req.user?.id

      if (!user_id || !supabase) {
        res.status(401).json({ error: 'Unauthorized' })
        return
      }

      const { data, error } = await supabase
        .from('conversations')
        .select(
          'id, scrubbed_message, created_at, messages(id, role, content, created_at), verdicts(id, final_response, created_at)'
        )
        .eq('user_id', user_id)
        .order('created_at', { ascending: false })

      if (error) throw error

      const conversations = data.map((conv: any) => {
        const sortedMessages = [...(conv.messages || [])].sort(
          (a: any, b: any) =>
            new Date(a.created_at).getTime() -
            new Date(b.created_at).getTime()
        )

        const firstUserMessage =
          sortedMessages.find((m: any) => m.role === 'user')?.content ||
          conv.scrubbed_message ||
          ''

        const lastAssistantMessage =
          [...sortedMessages].reverse().find((m: any) => m.role === 'assistant')
            ?.content ||
          [...(conv.verdicts || [])]
            .sort(
              (a: any, b: any) =>
                new Date(a.created_at).getTime() -
                new Date(b.created_at).getTime()
            )
            .pop()?.final_response ||
          ''

        return {
          id: conv.id,
          // The first user message remains the title.
          title: firstUserMessage || 'New Chat',
          created_at: conv.created_at,
          user_message: firstUserMessage,
          assistant_message: lastAssistantMessage,
        }
      })

      res.json({
        conversations,
      })
    } catch (err: any) {
      console.error('chat conversations error', err)
      res.status(500).json({
        error: String(err.message || err),
      })
    }
  }
)

// GET /api/chat/conversations/:id/messages
// Fetch all messages belonging to one conversation.
router.get(
  '/conversations/:id/messages',
  authMiddleware,
  async (req: ServiceRequest, res: Response) => {
    try {
      const { supabase } = req.services || {}
      const user_id = req.user?.id
      const { id } = req.params

      if (!user_id || !supabase) {
        res.status(401).json({ error: 'Unauthorized' })
        return
      }

      // Make sure the conversation belongs to this user.
      const { data: conversation, error: conversationError } =
        await supabase
          .from('conversations')
          .select('id')
          .eq('id', id)
          .eq('user_id', user_id)
          .single()

      if (conversationError || !conversation) {
        res.status(404).json({
          error: 'Conversation not found',
        })
        return
      }

      // Fetch messages from messages table
      const { data: dbMessages, error: messagesError } = await supabase
        .from('messages')
        .select('id, role, content, created_at')
        .eq('conversation_id', id)
        .order('created_at', { ascending: true })

      if (!messagesError && dbMessages && dbMessages.length > 0) {
        const messages = dbMessages.map((m: any, index: number) => ({
          id: new Date(m.created_at).getTime() || index + 1,
          role: m.role,
          content: m.content,
        }))

        res.json({
          messages,
        })
        return
      }

      // Fallback for legacy conversations where messages table is empty
      const { data, error } = await supabase
        .from('conversations')
        .select(
          'id, scrubbed_message, created_at, verdicts(id, final_response, created_at)'
        )
        .eq('id', id)
        .eq('user_id', user_id)
        .single()

      if (error) throw error

      const messages: {
        id: number
        role: 'user' | 'assistant'
        content: string
      }[] = []

      const baseId =
        new Date(data.created_at).getTime() ||
        Date.now()

      if (data.scrubbed_message) {
        messages.push({
          id: baseId,
          role: 'user',
          content: data.scrubbed_message,
        })
      }

      const sortedVerdicts = [
        ...(data.verdicts || []),
      ].sort(
        (a: any, b: any) =>
          new Date(a.created_at).getTime() -
          new Date(b.created_at).getTime()
      )

      sortedVerdicts.forEach(
        (verdict: any, index: number) => {
          if (verdict.final_response) {
            messages.push({
              id: baseId + index + 1,
              role: 'assistant',
              content: verdict.final_response,
            })
          }
        }
      )

      res.json({
        messages,
      })
    } catch (err: any) {
      console.error(
        'conversation messages error',
        err
      )

      res.status(500).json({
        error: String(err.message || err),
      })
    }
  }
)

// DELETE /api/chat/conversations/:id
router.delete(
  '/conversations/:id',
  authMiddleware,
  async (req: ServiceRequest, res: Response) => {
    try {
      const { supabase } = req.services || {}
      const user_id = req.user?.id
      const { id } = req.params

      if (!user_id || !supabase) {
        res.status(401).json({ error: 'Unauthorized' })
        return
      }

      // First verify that this conversation belongs
      // to the logged-in user.
      const { data: conversation, error: findError } =
        await supabase
          .from('conversations')
          .select('id')
          .eq('id', id)
          .eq('user_id', user_id)
          .single()

      if (findError || !conversation) {
        res.status(404).json({
          error: 'Conversation not found',
        })
        return
      }

      // Delete messages first
      await supabase
        .from('messages')
        .delete()
        .eq('conversation_id', id)

      // Delete verdicts because of FK constraint.
      const { error: verdictError } = await supabase
        .from('verdicts')
        .delete()
        .eq('conversation_id', id)

      if (verdictError) throw verdictError

      // Then delete the conversation.
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', id)
        .eq('user_id', user_id)

      if (error) throw error

      res.json({
        success: true,
      })
    } catch (err: any) {
      console.error('chat delete error', err)

      res.status(500).json({
        error: String(err.message || err),
      })
    }
  }
)

export default router