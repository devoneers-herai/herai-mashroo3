import {
  Request,
  Response,
  NextFunction,
} from 'express'
import { SupabaseClient } from '@supabase/supabase-js'

import { isApprovedCouncilMember } from '../services/council.service'
import { AuthenticatedUser } from './auth.middleware'

type ServiceRequest = Request & {
  services?: {
    supabase?: SupabaseClient
  }

  user?: AuthenticatedUser
}

/**
 * Council Authorization Middleware
 *
 * authMiddleware MUST run before this middleware.
 *
 * This middleware protects Council administration
 * endpoints. The authenticated user must have:
 *
 *   council_members.status === 'approved'
 *
 * IMPORTANT:
 * This middleware does NOT filter Council applications.
 *
 * A user being approved here means:
 *
 *   "the person requesting the Council dashboard
 *    is allowed to view it"
 *
 * It does NOT mean:
 *
 *   "only approved applications should be returned"
 *
 * Pending applications are retrieved separately by:
 *
 *   getPendingCouncilApplications()
 *
 * which queries:
 *
 *   council_members.status === 'pending'
 */
async function councilAuthMiddleware(
  req: ServiceRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id?.trim()
    const supabase = req.services?.supabase

    /*
     * authMiddleware should have populated req.user.
     */
    if (!userId) {
      res.status(401).json({
        error: 'Unauthorized',
      })
      return
    }

    /*
     * The Supabase client must be available.
     */
    if (!supabase) {
      console.error(
        'Council middleware: Supabase client not available'
      )

      res.status(500).json({
        error:
          'Supabase client not available',
      })
      return
    }

    /*
     * Only an APPROVED Council member may access
     * protected Council administration endpoints.
     *
     * pending  -> 403
     * rejected -> 403
     * approved -> continue
     */
    const approved =
      await isApprovedCouncilMember(
        userId,
        supabase
      )

    if (!approved) {
      res.status(403).json({
        error:
          'Forbidden: User is not an approved Council member',
      })
      return
    }

    /*
     * Authorization succeeded.
     *
     * Continue to the actual route handler.
     */
    next()
  } catch (err: unknown) {
    console.error(
      'Council authorization middleware error:',
      err
    )

    const message =
      err instanceof Error
        ? err.message
        : String(err)

    res.status(500).json({
      error: message,
    })
  }
}

export default councilAuthMiddleware