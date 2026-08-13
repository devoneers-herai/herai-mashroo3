import { Router, Request, Response, NextFunction } from 'express'
import { generateDraft, evaluateSafety } from '../services/ai.service'
import { handleChatLogic } from '../services/chat.service'

type ServiceRequest = Request & { services?: { supabase?: any; OPENAI_API_KEY?: string } }

const router = Router()

router.post('/', async (req: ServiceRequest, res: Response, next: NextFunction) => {
  try {
    const { message, region, persona, domain } = req.body
    const { supabase, OPENAI_API_KEY } = req.services || {}

    const output = await handleChatLogic({ message, region, persona, domain }, {
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
