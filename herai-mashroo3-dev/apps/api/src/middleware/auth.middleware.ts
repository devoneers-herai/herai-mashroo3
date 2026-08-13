import { Request, Response, NextFunction } from 'express'
import getServerConfig from '../config/server.config'
import createSupabaseClient from '../db/supabase'

/**
 * Token auth middleware: verifies JWT token from Authorization header.
 * Extracts user ID and attaches to req.user.
 * Format: "Authorization: Bearer <access_token>"
 */
export default function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const cfg = getServerConfig()
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' })
  }

  const token = authHeader.substring(7) // remove "Bearer "
  const supabase = createSupabaseClient(cfg.SUPABASE_URL, cfg.SUPABASE_SERVICE_ROLE_KEY)

  // Verify token (simple JWT verification using Supabase)
  supabase.auth
    .getUser(token)
    .then(({ data, error }) => {
      if (error || !data?.user?.id) {
        return res.status(401).json({ error: 'Invalid or expired token' })
      }

      ;(req as any).user = { id: data.user.id, email: data.user.email }
      next()
    })
    .catch((err) => {
      console.error('auth error', err)
      res.status(401).json({ error: 'Token verification failed' })
    })
}
