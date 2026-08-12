import { Router, Request, Response, NextFunction } from 'express'
import authMiddleware from '../middleware/auth.middleware'

type ServiceRequest = Request & { services?: { supabase?: any } }

const router = Router()

router.post('/rules', authMiddleware, async (req: ServiceRequest, res: Response, next: NextFunction) => {
  try {
    const { supabase } = req.services || {}
    const payload = req.body
    const { data, error } = await supabase.from('rules').insert([payload])
    if (error) throw error
    res.json({ data })
  } catch (err: any) {
    console.error('council.rules error', err)
    res.status(500).json({ error: String(err.message || err) })
  }
})

export default router
