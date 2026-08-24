import { Router, Request, Response } from 'express'
import { register, login, getProfile, updateProfile, forgotPassword, resetPassword } from '../services/auth.service'
import authMiddleware from '../middleware/auth.middleware'

type ServiceRequest = Request & {
  services?: {
    supabase?: any
  }
  user?: {
    id: string
    email: string
  }
}

const router = Router()

/**
 * POST /api/auth/register
 *
 * Creates a normal HerAI user account.
 *
 * Council membership is NOT created here.
 * A registered user can separately apply for Council through:
 *
 * POST /api/council/register
 */
router.post(
  '/register',
  async (req: ServiceRequest, res: Response) => {
    try {
      const { supabase } = req.services || {}

      if (!supabase) {
        return res.status(500).json({
          error: 'Supabase client not available',
        })
      }

      const {
        email,
        password,
        firstName,
        lastName,
        age,
        domain,
        country,
        city,
        phoneNumber,
      } = req.body

      if (
        typeof email !== 'string' ||
        !email.trim() ||
        typeof password !== 'string' ||
        !password ||
        typeof firstName !== 'string' ||
        !firstName.trim() ||
        typeof lastName !== 'string' ||
        !lastName.trim() ||
        age === undefined ||
        age === null ||
        typeof domain !== 'string' ||
        !domain.trim() ||
        typeof country !== 'string' ||
        !country.trim() ||
        typeof city !== 'string' ||
        !city.trim() ||
        typeof phoneNumber !== 'string' ||
        !phoneNumber.trim()
      ) {
        return res.status(400).json({
          error:
            'Missing required fields: email, password, firstName, lastName, age, domain, country, city, phoneNumber',
        })
      }

      if (typeof age !== 'number' || !Number.isFinite(age)) {
        return res.status(400).json({
          error: 'age must be a valid number',
        })
      }

      const result = await register(
        {
          email: email.trim().toLowerCase(),
          password,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          age,
          domain: domain.trim(),
          country: country.trim(),
          city: city.trim(),
          phoneNumber: phoneNumber.trim(),
        },
        supabase
      )

      return res.status(201).json(result)
    } catch (err: any) {
      console.error('Register error:', err)

      return res.status(400).json({
        error: String(err?.message || err),
      })
    }
  }
)

/**
 * POST /api/auth/login
 *
 * Authenticates an existing HerAI user with Supabase Auth.
 *
 * Council status is intentionally NOT checked here.
 *
 * A Council member is still a normal authenticated user.
 * Council permissions are determined separately by councilMiddleware.
 */
router.post(
  '/login',
  async (req: ServiceRequest, res: Response) => {
    try {
      const { supabase } = req.services || {}

      if (!supabase) {
        return res.status(500).json({
          error: 'Supabase client not available',
        })
      }

      const { email, password } = req.body

      if (
        typeof email !== 'string' ||
        !email.trim() ||
        typeof password !== 'string' ||
        !password
      ) {
        return res.status(400).json({
          error: 'Missing required fields: email, password',
        })
      }

      const result = await login(
        {
          email: email.trim().toLowerCase(),
          password,
        },
        supabase
      )

      return res.status(200).json(result)
    } catch (err: any) {
      console.error('Login error:', err)

      return res.status(401).json({
        error: String(err?.message || err),
      })
    }
  }
)

/**
 * GET /api/auth/profile
 *
 * Fetches the authenticated user's profile from public.users.
 */
router.get(
  '/profile',
  authMiddleware,
  async (req: ServiceRequest, res: Response) => {
    try {
      const { supabase } = req.services || {}
      const userId = req.user?.id

      if (!supabase || !userId) {
        return res.status(401).json({
          error: 'Unauthorized',
        })
      }

      const profile = await getProfile(userId, supabase)
      return res.status(200).json({ profile })
    } catch (err: any) {
      console.error('Get profile error:', err)
      return res.status(500).json({
        error: String(err?.message || err),
      })
    }
  }
)

/**
 * PATCH /api/auth/profile
 *
 * Updates profile fields in public.users for the authenticated user.
 */
router.patch(
  '/profile',
  authMiddleware,
  async (req: ServiceRequest, res: Response) => {
    try {
      const { supabase } = req.services || {}
      const userId = req.user?.id

      if (!supabase || !userId) {
        return res.status(401).json({
          error: 'Unauthorized',
        })
      }

      const {
        firstName,
        lastName,
        phoneNumber,
        age,
        domain,
        country,
        city,
      } = req.body

      const profile = await updateProfile(
        userId,
        {
          firstName,
          lastName,
          phoneNumber,
          age: typeof age === 'number' ? age : age ? Number(age) : undefined,
          domain,
          country,
          city,
        },
        supabase
      )

      return res.status(200).json({ profile })
    } catch (err: any) {
      console.error('Update profile error:', err)
      return res.status(400).json({
        error: String(err?.message || err),
      })
    }
  }
)

/**
 * POST /api/auth/forgot-password
 *
 * Initiates Supabase password reset email.
 */
router.post(
  '/forgot-password',
  async (req: ServiceRequest, res: Response) => {
    try {
      const { supabase } = req.services || {}

      if (!supabase) {
        return res.status(500).json({
          error: 'Supabase client not available',
        })
      }

      const { email } = req.body

      if (!email || typeof email !== 'string') {
        return res.status(400).json({
          error: 'Email is required',
        })
      }

      const result = await forgotPassword(email, supabase)
      return res.status(200).json(result)
    } catch (err: any) {
      console.error('Forgot password error:', err)
      return res.status(400).json({
        error: String(err?.message || err),
      })
    }
  }
)

/**
 * POST /api/auth/reset-password
 *
 * Completes password reset using bearer reset token.
 */
router.post(
  '/reset-password',
  async (req: ServiceRequest, res: Response) => {
    try {
      const { supabase } = req.services || {}

      if (!supabase) {
        return res.status(500).json({
          error: 'Supabase client not available',
        })
      }

      const authHeader = req.headers.authorization || ''
      const token = authHeader.replace(/^Bearer\s+/i, '').trim()
      const { password } = req.body

      if (!password || typeof password !== 'string') {
        return res.status(400).json({
          error: 'New password is required',
        })
      }

      if (password.length < 6) {
        return res.status(400).json({
          error: 'Password must be at least 6 characters',
        })
      }

      if (!token) {
        return res.status(401).json({
          error: 'Reset token is missing or expired',
        })
      }

      const result = await resetPassword(password, token, supabase)
      return res.status(200).json(result)
    } catch (err: any) {
      console.error('Reset password error:', err)
      return res.status(400).json({
        error: String(err?.message || err),
      })
    }
  }
)

export default router