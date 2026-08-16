import { Router, Request, Response, NextFunction } from 'express'
import { handleChatLogic } from '../services/chat.service'
import authMiddleware from '../middleware/auth.middleware'

type ServiceRequest = Request & {
  services?: { supabase?: any; OPENAI_API_KEY?: string }
  user?: any
}

const router = Router()

// Send a chat message
router.post(
  '/',
  authMiddleware,
  async (req: ServiceRequest, res: Response, next: NextFunction) => {
    try {
      const {
        message,
        region_code,
        domain_scope,
        persona,
        language,
        conversation_id,
      } = req.body

      const { supabase, OPENAI_API_KEY } = req.services || {}
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
        }
      )

      res.json(output)
    } catch (err: any) {
      console.error('chat error', err)
      res.status(500).json({ error: String(err.message || err) })
    }
  }
)

// Get the logged-in user's conversations
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
          'id,title, region_code, region_config_version, domain_scope, persona, created_at'
        )
        .eq('user_id', user_id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('get conversations error', error)
        res.status(500).json({ error: error.message })
        return
      }

      res.json({ conversations: data || [] })
    } catch (err: any) {
      console.error('get conversations error', err)
      res.status(500).json({ error: String(err.message || err) })
    }
  }
)

// Get messages for one conversation
router.get(
  '/conversations/:conversation_id/messages',
  authMiddleware,
  async (req: ServiceRequest, res: Response) => {
    try {
      const { supabase } = req.services || {}
      const user_id = req.user?.id
      const { conversation_id } = req.params

      if (!user_id || !supabase) {
        res.status(401).json({ error: 'Unauthorized' })
        return
      }

      // First verify that this conversation belongs to the logged-in user.
      const { data: conversation, error: conversationError } = await supabase
        .from('conversations')
        .select('id')
        .eq('id', conversation_id)
        .eq('user_id', user_id)
        .single()

      if (conversationError || !conversation) {
        res.status(404).json({ error: 'Conversation not found' })
        return
      }

      const { data, error } = await supabase
        .from('messages')
        .select('id, conversation_id, role, content, created_at')
        .eq('conversation_id', conversation_id)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('get messages error', error)
        res.status(500).json({ error: error.message })
        return
      }

      res.json({ messages: data || [] })
    } catch (err: any) {
      console.error('get messages error', err)
      res.status(500).json({ error: String(err.message || err) })
    }
  }
)
// Delete one conversation
router.delete(
  '/conversations/:conversation_id',
  authMiddleware,
  async (req: ServiceRequest, res: Response) => {
    try {
      const { supabase } = req.services || {}
      const user_id = req.user?.id
      const { conversation_id } = req.params

      if (!user_id || !supabase) {
        res.status(401).json({ error: 'Unauthorized' })
        return
      }

      // Make sure the conversation belongs to the logged-in user.
      const { data: conversation, error: conversationError } =
        await supabase
          .from('conversations')
          .select('id')
          .eq('id', conversation_id)
          .eq('user_id', user_id)
          .single()

      if (conversationError || !conversation) {
        res.status(404).json({ error: 'Conversation not found' })
        return
      }

      // Delete the messages first.
      const { error: messagesError } = await supabase
        .from('messages')
        .delete()
        .eq('conversation_id', conversation_id)

      if (messagesError) {
        console.error('delete conversation messages error', messagesError)
        res.status(500).json({ error: messagesError.message })
        return
      }

      // Delete safety verdicts belonging to the conversation.
      const { error: verdictsError } = await supabase
        .from('verdicts')
        .delete()
        .eq('conversation_id', conversation_id)

      if (verdictsError) {
        console.error('delete conversation verdicts error', verdictsError)
        res.status(500).json({ error: verdictsError.message })
        return
      }

      // Finally delete the conversation itself.
      const { error: deleteError } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversation_id)
        .eq('user_id', user_id)

      if (deleteError) {
        console.error('delete conversation error', deleteError)
        res.status(500).json({ error: deleteError.message })
        return
      }

      res.json({ success: true })
    } catch (err: any) {
      console.error('delete conversation error', err)
      res.status(500).json({ error: String(err.message || err) })
    }
  }
)
export default router