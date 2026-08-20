import { Router, Request, Response } from 'express'
import { register, login } from '../services/auth.service'

type ServiceRequest = Request & {
  services?: {
    supabase?: any
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

export default router