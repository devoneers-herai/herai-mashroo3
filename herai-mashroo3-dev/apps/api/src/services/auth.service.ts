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
 * Register a normal HerAI user.
 *
 * This creates:
 *
 * 1. Supabase Auth account
 * 2. public.users profile
 *
 * Council membership is intentionally NOT created here.
 * A normal authenticated user must separately apply through:
 *
 * POST /api/council/register
 */
export async function register(
  input: RegisterInput,
  supabase: SupabaseClient
): Promise<AuthResponse> {
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
  } = input

  // Basic service-level validation.
  if (!email?.trim()) {
    throw new Error('Email is required')
  }

  if (!password) {
    throw new Error('Password is required')
  }

  if (!firstName?.trim()) {
    throw new Error('First name is required')
  }

  if (!lastName?.trim()) {
    throw new Error('Last name is required')
  }

  if (!Number.isFinite(age)) {
    throw new Error('Age must be a valid number')
  }

  if (!domain?.trim()) {
    throw new Error('Domain is required')
  }

  if (!country?.trim()) {
    throw new Error('Country is required')
  }

  if (!city?.trim()) {
    throw new Error('City is required')
  }

  if (!phoneNumber?.trim()) {
    throw new Error('Phone number is required')
  }

  // 1. Create Supabase Auth account.
  const { data: authData, error: signUpError } =
    await supabase.auth.signUp({
      email: email.trim(),
      password,
    })

  if (signUpError) {
    throw new Error(
      `Auth signup failed: ${signUpError.message}`
    )
  }

  const userId = authData?.user?.id

  if (!userId) {
    throw new Error(
      'No user ID returned from signup'
    )
  }

  // 2. Create server-side admin client.
  //
  // This client is intentionally server-only and uses
  // the Supabase service-role key.
  const cfg = getServerConfig()

  const adminClient = createSupabaseClient(
    cfg.SUPABASE_URL,
    cfg.SUPABASE_SERVICE_ROLE_KEY
  )

  // 3. Create the public user profile.
  const { error: profileError } =
    await adminClient
      .from('users')
      .insert([
        {
          id: userId,
          email: email.trim(),
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          age,
          domain: domain.trim(),
          country: country.trim(),
          city: city.trim(),
          phone_number: phoneNumber.trim(),
        },
      ])

  if (profileError) {
    console.error(
      'Profile creation failed:',
      profileError
    )

    // The Auth account was already created.
    // Attempt to remove it so we do not leave an orphaned
    // authentication account without a profile.
    try {
      const { error: cleanupError } =
        await adminClient.auth.admin.deleteUser(
          userId
        )

      if (cleanupError) {
        console.error(
          'Failed to clean up Auth user after profile creation failure:',
          cleanupError
        )
      }
    } catch (cleanupError) {
      console.error(
        'Unexpected Auth cleanup error:',
        cleanupError
      )
    }

    throw new Error(
      `Profile creation failed: ${profileError.message}`
    )
  }

  // 4. Return the authentication response.
  //
  // Depending on Supabase email-confirmation settings,
  // session may be null immediately after signup.
  return {
    user: {
      id: userId,
      email: authData.user?.email || email.trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
    },
    session: {
      access_token:
        authData.session?.access_token || '',
      refresh_token:
        authData.session?.refresh_token,
    },
  }
}

/**
 * Login with email and password.
 *
 * This authenticates the normal Supabase user.
 * Council authorization is handled separately by
 * councilMiddleware.
 */
export async function login(
  input: LoginInput,
  supabase: SupabaseClient
): Promise<AuthResponse> {
  const email = input.email?.trim()
  const password = input.password

  if (!email) {
    throw new Error('Email is required')
  }

  if (!password) {
    throw new Error('Password is required')
  }

  // 1. Authenticate with Supabase.
  const { data: authData, error: loginError } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    })

  if (loginError) {
    throw new Error(
      `Login failed: ${loginError.message}`
    )
  }

  const user = authData?.user
  const session = authData?.session

  if (!user || !session) {
    throw new Error(
      'No user or session returned from login'
    )
  }

  // 2. Create a server-side admin client.
  //
  // We use this to read public.users without depending
  // on the authenticated client's RLS permissions.
  const cfg = getServerConfig()

  const adminClient = createSupabaseClient(
    cfg.SUPABASE_URL,
    cfg.SUPABASE_SERVICE_ROLE_KEY
  )

  // 3. Fetch the user's profile.
  const {
    data: profileData,
    error: profileError,
  } = await adminClient
    .from('users')
    .select(
      'first_name, last_name'
    )
    .eq('id', user.id)
    .maybeSingle()

  if (profileError) {
    console.error(
      'Failed to fetch user profile:',
      profileError
    )

    throw new Error(
      `Failed to fetch user profile: ${profileError.message}`
    )
  }

  // 4. Return authenticated user even if the profile row
  // does not exist.
  //
  // This keeps authentication separate from profile data.
  if (!profileData) {
    console.warn(
      `No profile found in public.users for user ID: ${user.id}`
    )

    return {
      user: {
        id: user.id,
        email: user.email || email,
      },
      session: {
        access_token: session.access_token,
        refresh_token:
          session.refresh_token,
      },
    }
  }

  // 5. Return authenticated user + profile names.
  return {
    user: {
      id: user.id,
      email: user.email || email,
      firstName:
        profileData.first_name || undefined,
      lastName:
        profileData.last_name || undefined,
    },
    session: {
      access_token: session.access_token,
      refresh_token:
        session.refresh_token,
    },
  }
}

/**
 * Verify a Supabase JWT and return its authenticated user ID.
 *
 * Used when backend code needs to verify a token directly.
 */
export async function verifyToken(
  token: string,
  supabase: SupabaseClient
): Promise<string> {
  if (!token) {
    throw new Error(
      'Token verification failed: token is required'
    )
  }

  const { data, error } =
    await supabase.auth.getUser(token)

  if (error || !data?.user?.id) {
    throw new Error(
      `Token verification failed: ${
        error?.message || 'no user'
      }`
    )
  }

  return data.user.id
}

export async function getProfile(
  userId: string,
  supabase: SupabaseClient
) {
  if (!userId) {
    throw new Error('User ID is required')
  }

  const cfg = getServerConfig()
  const adminClient = createSupabaseClient(
    cfg.SUPABASE_URL,
    cfg.SUPABASE_SERVICE_ROLE_KEY
  )

  const { data, error } = await adminClient
    .from('users')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to fetch user profile: ${error.message}`)
  }

  return data
}

export type UpdateProfileInput = {
  firstName?: string
  lastName?: string
  phoneNumber?: string
  age?: number
  domain?: string
  country?: string
  city?: string
}

export async function updateProfile(
  userId: string,
  input: UpdateProfileInput,
  supabase: SupabaseClient
) {
  if (!userId) {
    throw new Error('User ID is required')
  }

  const cfg = getServerConfig()
  const adminClient = createSupabaseClient(
    cfg.SUPABASE_URL,
    cfg.SUPABASE_SERVICE_ROLE_KEY
  )

  const updateData: Record<string, any> = {
    updated_at: new Date().toISOString(),
  }

  if (input.firstName !== undefined) updateData.first_name = input.firstName.trim()
  if (input.lastName !== undefined) updateData.last_name = input.lastName.trim()
  if (input.phoneNumber !== undefined) updateData.phone_number = input.phoneNumber.trim()
  if (input.age !== undefined) updateData.age = input.age
  if (input.domain !== undefined) updateData.domain = input.domain.trim()
  if (input.country !== undefined) updateData.country = input.country.trim()
  if (input.city !== undefined) updateData.city = input.city.trim()

  const { data, error } = await adminClient
    .from('users')
    .update(updateData)
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update user profile: ${error.message}`)
  }

  return data
}

export async function forgotPassword(
  email: string,
  supabase: SupabaseClient
) {
  if (!email?.trim()) {
    throw new Error('Email is required')
  }

  const cfg = getServerConfig()
  const adminClient = createSupabaseClient(
    cfg.SUPABASE_URL,
    cfg.SUPABASE_SERVICE_ROLE_KEY
  )

  const { error } = await adminClient.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password`,
  })

  if (error) {
    throw new Error(`Password reset request failed: ${error.message}`)
  }

  return { success: true, message: 'Password reset email sent' }
}

export async function resetPassword(
  password: string,
  accessToken: string,
  supabase: SupabaseClient
) {
  if (!password) {
    throw new Error('New password is required')
  }

  if (!accessToken) {
    throw new Error('Access token is required')
  }

  const { data: userAuth, error: authErr } = await supabase.auth.getUser(accessToken)
  if (authErr || !userAuth?.user) {
    throw new Error('Invalid or expired reset token')
  }

  const cfg = getServerConfig()
  const adminClient = createSupabaseClient(
    cfg.SUPABASE_URL,
    cfg.SUPABASE_SERVICE_ROLE_KEY
  )

  const { error } = await adminClient.auth.admin.updateUserById(userAuth.user.id, {
    password,
  })

  if (error) {
    throw new Error(`Failed to reset password: ${error.message}`)
  }

  return { success: true, message: 'Password has been successfully reset' }
}

export default {
  register,
  login,
  verifyToken,
  getProfile,
  updateProfile,
  forgotPassword,
  resetPassword,
}