import { Router, Request, Response, NextFunction } from 'express'
import { register, login } from '../services/auth.service'

type ServiceRequest = Request & { services?: { supabase?: any } }

const router = Router()

/**
 * POST /api/auth/register
 * Register a new user with email, password, and profile info.
 *
 * Request body:
 * {
 *   "email": "user@example.com",
 *   "password": "securePassword123",
 *   "firstName": "John",
 *   "lastName": "Doe",
 *   "age": 30,
 *   "domain": "healthcare",
 *   "country": "Egypt",
 *   "city": "Cairo",
 *   "phoneNumber": "+201234567890"
 * }
 *
 * Response:
 * {
 *   "user": { "id": "uuid", "email": "...", "firstName": "...", "lastName": "..." },
 *   "session": { "access_token": "jwt_token", "refresh_token": "..." }
 * }
 */
router.post('/register', async (req: ServiceRequest, res: Response, next: NextFunction) => {
  try {
    const { supabase } = req.services || {}
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase client not available' })
    }

    const { email, password, firstName, lastName, age, domain, country, city, phoneNumber } =
      req.body

    if (!email || !password || !firstName || !lastName || !phoneNumber) {
      return res.status(400).json({
        error: 'Missing required fields: email, password, firstName, lastName, phoneNumber',
      })
    }

    const result = await register(
      { email, password, firstName, lastName, age, domain, country, city, phoneNumber },
      supabase
    )

    res.status(201).json(result)
  } catch (err: any) {
    console.error('register error', err)
    res.status(400).json({ error: String(err.message || err) })
  }
})

/**
 * POST /api/auth/login
 * Login with email and password.
 *
 * Request body:
 * {
 *   "email": "user@example.com",
 *   "password": "securePassword123"
 * }
 *
 * Response:
 * {
 *   "user": { "id": "uuid", "email": "...", "firstName": "...", "lastName": "..." },
 *   "session": { "access_token": "jwt_token", "refresh_token": "..." }
 * }
 */
router.post('/login', async (req: ServiceRequest, res: Response, next: NextFunction) => {
  try {
    const { supabase } = req.services || {}
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase client not available' })
    }

    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Missing required fields: email, password' })
    }

    const result = await login({ email, password }, supabase)

    res.json(result)
  } catch (err: any) {
    console.error('login error', err)
    res.status(401).json({ error: String(err.message || err) })
  }
})

export default router
