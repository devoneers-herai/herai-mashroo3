import { Router, Request, Response, NextFunction } from 'express'
import authMiddleware from '../middleware/auth.middleware'
import councilMiddleware from '../middleware/council.middleware'
import { registerCouncilMember, getCouncilMemberStatus, updateCouncilMemberStatus, getAllCouncilMembers } from '../services/council.service'
import { clearResponseCache } from '../services/cache.service'

type ServiceRequest = Request & { services?: { supabase?: any }; user?: { id: string; email: string } }

const router = Router()

// Register new council member (requires JWT authentication).
// The authenticated user's ID is used — no sign-up happens here.
router.post('/register', authMiddleware, async (req: ServiceRequest, res: Response) => {
  try {
    const { supabase } = req.services || {}
    const user_id = req.user?.id
    if (!user_id || !supabase) return res.status(401).json({ error: 'Unauthorized or Missing deps' })

    const { motivation, experience, contribution, availability } = req.body || {}
    const result = await registerCouncilMember(user_id, supabase, {
      motivation,
      experience,
      contribution,
      availability,
    })
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

// Get all council members — requires caller to be an approved council member
router.get('/members', authMiddleware, councilMiddleware, async (req: ServiceRequest, res: Response) => {
  try {
    const { supabase } = req.services || {}
    const { status } = req.query
    if (!supabase) return res.status(500).json({ error: 'Missing deps' })

    const members = await getAllCouncilMembers(supabase, status as any)
    res.json(members)
  } catch (err: any) {
    res.status(500).json({ error: String(err.message || err) })
  }
})

// Approve member — requires caller to be an approved council member (councilMiddleware).
// This prevents self-approval and restricts the action to approved council members only.
router.post('/members/:user_id/approve', authMiddleware, councilMiddleware, async (req: ServiceRequest, res: Response) => {
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

// Reject member — requires caller to be an approved council member (councilMiddleware).
router.post('/members/:user_id/reject', authMiddleware, councilMiddleware, async (req: ServiceRequest, res: Response) => {
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

// Create rule — requires FULL council approval
router.post('/rules', authMiddleware, councilMiddleware, async (req: ServiceRequest, res: Response, next: NextFunction) => {
  try {
    const { supabase } = req.services || {}
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase client not available' })
    }

    const { title, rule_text, domain, region_code } = req.body
    if (!title || !rule_text) {
      return res.status(400).json({ error: 'title and rule_text are required' })
    }

    const { data, error } = await supabase.from('council_rules').insert([{
      title,
      rule_text,
      domain: domain || null,
      region_code: region_code || null,
      created_by: req.user?.id,
      is_active: false,  // Rules must NOT be active immediately — governance lifecycle required
    }]).select().single()

    if (error) throw error

    // Invalidate AI response cache — new rules may change what answers are safe.
    clearResponseCache()
    console.log('[cache] AI response cache cleared after new council rule added.')

    res.status(201).json(data)
  } catch (err: any) {
    console.error('council.rules error', err)
    res.status(500).json({ error: String(err.message || err) })
  }
})

// List all council rules
router.get('/rules', authMiddleware, councilMiddleware, async (req: ServiceRequest, res: Response) => {
  try {
    const { supabase } = req.services || {}
    if (!supabase) return res.status(500).json({ error: 'Missing deps' })

    const { data, error } = await supabase.from('council_rules').select('*').order('created_at', { ascending: false })
    if (error) throw error
    res.json(data)
  } catch (err: any) {
    res.status(500).json({ error: String(err.message || err) })
  }
})

// Delete a council rule
router.delete('/rules/:id', authMiddleware, councilMiddleware, async (req: ServiceRequest, res: Response) => {
  try {
    const { supabase } = req.services || {}
    if (!supabase) return res.status(500).json({ error: 'Missing deps' })

    const { error } = await supabase.from('council_rules').delete().eq('id', req.params.id)
    if (error) throw error

    // Invalidate AI response cache — removed rules may affect previously cached answers.
    clearResponseCache()
    console.log('[cache] AI response cache cleared after council rule deleted.')

    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ error: String(err.message || err) })
  }
})

export default router

