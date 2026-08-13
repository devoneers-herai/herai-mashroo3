import { SupabaseClient } from '@supabase/supabase-js'
import getServerConfig from '../config/server.config'
import createSupabaseClient from '../db/supabase'

export type RegisterInput = {
  email: string
  password: string
  firstName: string
  lastName: string
  age: number
  domain: string
  country: string
  city: string
  phoneNumber: string
}

export type LoginInput = {
  email: string
  password: string
}

export type AuthResponse = {
  user: {
    id: string
    email: string
    firstName?: string
    lastName?: string
  }
  session: {
    access_token: string
    refresh_token?: string
  }
}

/**
 * Register a new user with email, password, and profile info.
 * Creates a Supabase Auth account and stores user profile in public.users table.
 */
export async function register(
  input: RegisterInput,
  supabase: SupabaseClient
): Promise<AuthResponse> {
  const { email, password, firstName, lastName, age, domain, country, city, phoneNumber } = input

  // 1. Create Supabase Auth account
  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  })

  if (signUpError) {
    throw new Error(`Auth signup failed: ${signUpError.message}`)
  }

  const userId = authData?.user?.id
  if (!userId) {
    throw new Error('No user ID returned from signup')
  }

  const cfg = getServerConfig()
  const adminClient = createSupabaseClient(cfg.SUPABASE_URL, cfg.SUPABASE_SERVICE_ROLE_KEY)

  // 2. Create user profile in public.users table
  const { error: profileError } = await adminClient.from('users').insert([
    {
      id: userId,
      email,
      first_name: firstName,
      last_name: lastName,
      age,
      domain,
      country,
      city,
      phone_number: phoneNumber,
    },
  ])

  if (profileError) {
    // If profile creation fails, the auth account exists but profile doesn't
    // In production, you might want to rollback or handle this more carefully
    console.error('Profile creation failed:', profileError)
    throw new Error(`Profile creation failed: ${profileError.message}`)
  }

  // 3. Return auth response (session info)
  return {
    user: {
      id: userId,
      email,
      firstName,
      lastName,
    },
    session: {
      access_token: authData.session?.access_token || '',
      refresh_token: authData.session?.refresh_token,
    },
  }
}

/**
 * Login with email and password.
 * Returns authenticated session with access token.
 */
export async function login(input: LoginInput, supabase: SupabaseClient): Promise<AuthResponse> {
  const { email, password } = input

  const { data: authData, error: loginError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (loginError) {
    throw new Error(`Login failed: ${loginError.message}`)
  }

  const user = authData?.user
  const session = authData?.session

  if (!user || !session) {
    throw new Error('No user or session returned from login')
  }

  // Fetch user profile
  const { data: profileData } = await supabase
    .from('users')
    .select('first_name, last_name')
    .eq('id', user.id)
    .single()

  return {
    user: {
      id: user.id,
      email: user.email || '',
      firstName: profileData?.first_name,
      lastName: profileData?.last_name,
    },
    session: {
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    },
  }
}

/**
 * Verify JWT token and return authenticated user ID.
 * Used by middleware to check if request has valid auth.
 */
export async function verifyToken(token: string, supabase: SupabaseClient): Promise<string> {
  const { data, error } = await supabase.auth.getUser(token)

  if (error || !data?.user?.id) {
    throw new Error(`Token verification failed: ${error?.message || 'no user'}`)
  }

  return data.user.id
}

export default { register, login, verifyToken }
