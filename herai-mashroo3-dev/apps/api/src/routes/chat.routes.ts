import { Router, Request, Response, NextFunction } from 'express'
import { handleChatLogic } from '../services/chat.service'
import authMiddleware from '../middleware/auth.middleware'

type ServiceRequest = Request & { services?: { supabase?: any; OPENAI_API_KEY?: string }; user?: any }

const router = Router()

router.post('/', authMiddleware, async (req: ServiceRequest, res: Response, next: NextFunction) => {
  try {
    const { message, region_code, domain_scope, persona } = req.body
    const { supabase, OPENAI_API_KEY } = req.services || {}
    const user_id = req.user?.id

    if (!user_id) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const output = await handleChatLogic({ message, region_code, domain_scope, persona, user_id }, {
      supabase,
      openaiKey: OPENAI_API_KEY as string,
    })

    res.json(output)
  } catch (err: any) {
    console.error('chat error', err)
    res.status(500).json({ error: String(err.message || err) })
  }
})

export default router
