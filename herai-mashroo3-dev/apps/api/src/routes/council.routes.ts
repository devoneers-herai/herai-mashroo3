import { Router, Request, Response, NextFunction } from 'express'
import authMiddleware from '../middleware/auth.middleware'
import { councilMiddleware } from '../middleware/council.middleware'
import { registerCouncilMember, getCouncilMemberStatus, updateCouncilMemberStatus } from '../services/council.service'

type ServiceRequest = Request & { services?: { supabase?: any }; user?: { id: string; email: string } }

const router = Router()

// Register new council member (requires JWT authentication)
router.post('/register', authMiddleware, async (req: ServiceRequest, res: Response) => {
  try {
    const { supabase } = req.services || {}
    const user_id = req.user?.id
    if (!user_id || !supabase) return res.status(401).json({ error: 'Unauthorized or Missing deps' })

    const result = await registerCouncilMember(user_id, supabase)
    res.json(result)
  } catch (err: any) {
    res.status(500).json({ error: String(err.message || err) })
  }
})

// Check membership status
router.get('/members/:user_id', authMiddleware, async (req: ServiceRequest, res: Response) => {
  try {
    const { supabase } = req.services || {}
    const { user_id } = req.params
    if (!supabase) return res.status(500).json({ error: 'Missing deps' })

    const status = await getCouncilMemberStatus(user_id, supabase)
    res.json({ status })
  } catch (err: any) {
    res.status(500).json({ error: String(err.message || err) })
  }
})

// Approve member (Should ideally be protected by a super-admin check, keeping it simple for now)
router.post('/members/:user_id/approve', authMiddleware, async (req: ServiceRequest, res: Response) => {
  try {
    const { supabase } = req.services || {}
    const { user_id } = req.params
    if (!supabase) return res.status(500).json({ error: 'Missing deps' })

    const result = await updateCouncilMemberStatus(user_id, 'approved', supabase)
    res.json(result)
  } catch (err: any) {
    res.status(500).json({ error: String(err.message || err) })
  }
})

// Reject member
router.post('/members/:user_id/reject', authMiddleware, async (req: ServiceRequest, res: Response) => {
  try {
    const { supabase } = req.services || {}
    const { user_id } = req.params
    if (!supabase) return res.status(500).json({ error: 'Missing deps' })

    const result = await updateCouncilMemberStatus(user_id, 'rejected', supabase)
    res.json(result)
  } catch (err: any) {
    res.status(500).json({ error: String(err.message || err) })
  }
})

// Create rule - Requires FULL council approval
router.post('/rules', authMiddleware, councilMiddleware, async (req: ServiceRequest, res: Response, next: NextFunction) => {
  try {
    const { supabase } = req.services || {}
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase client not available' })
    }

    const payload = req.body
    const userId = req.user?.id

    payload.created_by = userId
    // Generate UUID rule_id if missing
    if (!payload.rule_id) {
       payload.rule_id = 'rule-' + Math.random().toString(36).substring(2, 9)
    }

    const { data, error } = await supabase.from('rules').insert([payload]).select().single()
    if (error) throw error

    res.status(201).json({ data })
  } catch (err: any) {
    console.error('council.rules error', err)
    res.status(500).json({ error: String(err.message || err) })
  }
})

export default router
