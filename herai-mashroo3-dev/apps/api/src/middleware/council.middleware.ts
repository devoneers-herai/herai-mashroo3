import { Request, Response, NextFunction } from 'express'
import { isApprovedCouncilMember } from '../services/council.service'

type ServiceRequest = Request & { services?: { supabase?: any }; user?: { id: string; email: string } }

/**
 * Council Authorization Middleware
 * 
 * Checks that:
 * 1. User is authenticated (has valid JWT)
 * 2. User has a council_members record with status = 'approved'
 * 
 * Returns 403 Forbidden if either check fails
 */
async function councilAuthMiddleware(req: ServiceRequest, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user?.id
    const supabase = req.services?.supabase

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: No user ID found' })
    }

    if (!supabase) {
      return res.status(500).json({ error: 'Supabase client not available' })
    }

    // Check if user is approved council member
    const isApproved = await isApprovedCouncilMember(userId, supabase)

    if (!isApproved) {
      return res.status(403).json({
        error: 'Forbidden: User is not an approved council member',
        message: 'Council access requires pending approval',
      })
    }

    // User is approved - continue to next handler
    next()
  } catch (err: any) {
    console.error('Council auth middleware error', err)
    res.status(500).json({ error: String(err.message || err) })
  }
}

export default councilAuthMiddleware
