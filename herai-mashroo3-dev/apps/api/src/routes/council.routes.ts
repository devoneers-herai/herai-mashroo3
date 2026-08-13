import { Router, Request, Response, NextFunction } from 'express'
import authMiddleware from '../middleware/auth.middleware'

type ServiceRequest = Request & { services?: { supabase?: any }; user?: { id: string; email: string } }

const router = Router()

/**
 * POST /api/council/rules
 * Create a new Council rule (requires JWT authentication).
 *
 * Authorization: Bearer <access_token>
 *
 * Request body:
 * {
 *   "region_code": "EG",
 *   "domain_scope": "healthcare",
 *   "category": "bias",
 *   "severity": "high",
 *   "decision_type": "block",
 *   "trigger_description": "harmful content",
 *   "adjustment_instruction": "rewrite",
 *   "fallback_message": "blocked",
 *   "created_by": "user_email@example.com"
 * }
 */
router.post('/rules', authMiddleware, async (req: ServiceRequest, res: Response, next: NextFunction) => {
  try {
    const { supabase } = req.services || {}
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase client not available' })
    }

    const payload = req.body
    const userId = (req as any).user?.id

    // Attach creator info
    payload.created_by = (req as any).user?.email || userId

    const { data, error } = await supabase.from('rules').insert([payload])
    if (error) throw error

    res.status(201).json({ data })
  } catch (err: any) {
    console.error('council.rules error', err)
    res.status(500).json({ error: String(err.message || err) })
  }
})

export default router
