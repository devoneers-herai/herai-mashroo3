import {
  Request,
  Response,
  NextFunction,
} from 'express'

import getServerConfig from '../config/server.config'
import createSupabaseClient from '../db/supabase'

export type AuthenticatedUser = {
  id: string
  email?: string
}

export type AuthenticatedRequest = Request & {
  user?: AuthenticatedUser
}

/**
 * Authentication Middleware
 *
 * Verifies:
 *
 *   Authorization: Bearer <access_token>
 *
 * On success:
 *
 *   req.user = {
 *     id,
 *     email
 *   }
 *
 * This middleware ONLY authenticates the user.
 *
 * It does NOT check Council membership.
 *
 * Council authorization is handled separately:
 *
 *   authMiddleware
 *        ↓
 *   councilMiddleware
 */
export default async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader =
      req.headers.authorization

    /*
     * Authorization header is required.
     */
    if (!authHeader) {
      res.status(401).json({
        error:
          'Missing Authorization header',
      })
      return
    }

    /*
     * Only Bearer authentication is accepted.
     */
    if (
      !authHeader.startsWith('Bearer ')
    ) {
      res.status(401).json({
        error:
          'Invalid Authorization header format',
      })
      return
    }

    const token =
      authHeader.slice(7).trim()

    if (!token) {
      res.status(401).json({
        error:
          'Missing access token',
      })
      return
    }

    const cfg = getServerConfig()

    /*
     * Server-side Supabase configuration
     * is required.
     */
    if (
      !cfg.SUPABASE_URL ||
      !cfg.SUPABASE_SERVICE_ROLE_KEY
    ) {
      console.error(
        'Auth middleware: Supabase configuration is missing'
      )

      res.status(500).json({
        error:
          'Authentication service is not configured',
      })
      return
    }

    /*
     * Create the server-side Supabase client.
     *
     * The service-role key MUST remain server-side.
     */
    const supabase =
      createSupabaseClient(
        cfg.SUPABASE_URL,
        cfg.SUPABASE_SERVICE_ROLE_KEY
      )

    /*
     * Validate the access token with Supabase.
     */
    const {
      data,
      error,
    } = await supabase.auth.getUser(
      token
    )

    if (
      error ||
      !data?.user?.id
    ) {
      res.status(401).json({
        error:
          'Invalid or expired token',
      })
      return
    }

    /*
     * Attach authenticated identity.
     */
    req.user = {
      id: data.user.id,
      email:
        data.user.email ||
        undefined,
    }

    /*
     * Authentication succeeded.
     */
    next()
  } catch (err: unknown) {
    console.error(
      'Authentication middleware error:',
      err
    )

    res.status(401).json({
      error:
        'Token verification failed',
    })
  }
}