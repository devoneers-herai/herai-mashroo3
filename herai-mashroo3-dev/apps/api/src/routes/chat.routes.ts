import { Router, Request, Response, NextFunction } from 'express'
import { handleChatLogic } from '../services/chat.service'
import authMiddleware from '../middleware/auth.middleware'

type ServiceRequest = Request & { services?: { supabase?: any; OPENAI_API_KEY?: string }; user?: any }

const router = Router()

router.post('/', authMiddleware, async (req: ServiceRequest, res: Response, next: NextFunction) => {
  try {
    const { message, region_code, domain_scope, persona, language } = req.body
    const { supabase, OPENAI_API_KEY } = req.services || {}
    const user_id = req.user?.id

    if (!user_id) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const output = await handleChatLogic({ message, region_code, domain_scope, persona, user_id, language }, {
      supabase,
      openaiKey: OPENAI_API_KEY as string,
    })

    res.json(output)
  } catch (err: any) {
    console.error('chat error', err)
    res.status(500).json({ error: String(err.message || err) })
  }
})

// GET /api/chat/history - fetch user's past messages
router.get('/history', authMiddleware, async (req: ServiceRequest, res: Response) => {
  try {
    const { supabase } = req.services || {}
    const user_id = req.user?.id

    if (!user_id || !supabase) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const { data, error } = await supabase
      .from('conversations')
      .select('id, scrubbed_message, created_at, verdicts(id, final_response, created_at)')
      .eq('user_id', user_id)
      .order('created_at', { ascending: true })

    if (error) throw error

    // Transform into a flat list of chat messages
    const formattedMessages: { id: number; role: 'user' | 'assistant'; content: string }[] = []
    
    data.forEach((conv: any, index: number) => {
      const baseId = new Date(conv.created_at).getTime() || index * 2
      if (conv.scrubbed_message) {
        formattedMessages.push({
          id: baseId,
          role: 'user',
          content: conv.scrubbed_message,
        })
      }
      if (conv.verdicts && conv.verdicts.length > 0) {
        const lastVerdict = conv.verdicts[conv.verdicts.length - 1]
        if (lastVerdict.final_response) {
          formattedMessages.push({
            id: baseId + 1,
            role: 'assistant',
            content: lastVerdict.final_response,
          })
        }
      }
    })

    res.json({ messages: formattedMessages })
  } catch (err: any) {
    console.error('chat history error', err)
    res.status(500).json({ error: String(err.message || err) })
  }
})

export default router
