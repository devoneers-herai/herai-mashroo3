import { Request, Response, NextFunction } from 'express'
import getServerConfig from '../config/server.config'

export default function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const cfg = getServerConfig()
  const token = req.headers['x-council-token'] || (req as any).body?.token
  if (!token || String(token) !== cfg.COUNCIL_SHARED_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  next()
}
