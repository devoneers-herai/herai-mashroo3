import { SupabaseClient } from '@supabase/supabase-js'

export type CouncilRegisterInput = {
  email: string
  password: string
  firstName: string
  lastName: string
}

export type CouncilApprovalInput = {
  user_id: string
  action: 'approve' | 'reject'
}

export type CouncilMemberResponse = {
  id: string
  user_id: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

/**
 * Register a new Council member
 * 1. Create Supabase Auth account
 * 2. Create council_members record with pending status
 */
export async function registerCouncilMember(
  input: CouncilRegisterInput,
  supabase: SupabaseClient
): Promise<CouncilMemberResponse> {
  const { email, password, firstName, lastName } = input

  // 1. Create Supabase Auth account
  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  })

  if (signUpError) {
    throw new Error(`Council signup failed: ${signUpError.message}`)
  }

  const userId = authData?.user?.id
  if (!userId) {
    throw new Error('No user ID returned from signup')
  }

  // 2. Create user profile in public.users table
  const { error: profileError } = await supabase.from('users').insert([
    {
      id: userId,
      email,
      first_name: firstName,
      last_name: lastName,
    },
  ])

  if (profileError) {
    console.error('Profile creation failed:', profileError)
    throw new Error(`Profile creation failed: ${profileError.message}`)
  }

  // 3. Create council_members record with pending status
  const { data: councilData, error: councilError } = await supabase
    .from('council_members')
    .insert([
      {
        user_id: userId,
        status: 'pending',
      },
    ])
    .select()
    .single()

  if (councilError) {
    console.error('Council registration failed:', councilError)
    throw new Error(`Council registration failed: ${councilError.message}`)
  }

  return {
    id: councilData.id,
    user_id: councilData.user_id,
    status: councilData.status,
    created_at: councilData.created_at,
  }
}

/**
 * Get council member status
 * Returns the council membership record and status
 */
export async function getCouncilMemberStatus(
  userId: string,
  supabase: SupabaseClient
): Promise<CouncilMemberResponse | null> {
  const { data, error } = await supabase
    .from('council_members')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found
      return null
    }
    throw new Error(`Failed to get council member status: ${error.message}`)
  }

  return {
    id: data.id,
    user_id: data.user_id,
    status: data.status,
    created_at: data.created_at,
  }
}

/**
 * Approve or reject a council member application
 * Only callable by admin/authorized users
 */
export async function updateCouncilMemberStatus(
  input: CouncilApprovalInput,
  supabase: SupabaseClient
): Promise<CouncilMemberResponse> {
  const { user_id, action } = input

  const status = action === 'approve' ? 'approved' : 'rejected'

  const { data, error } = await supabase
    .from('council_members')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('user_id', user_id)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update council member status: ${error.message}`)
  }

  return {
    id: data.id,
    user_id: data.user_id,
    status: data.status,
    created_at: data.created_at,
  }
}

/**
 * Check if a user is an approved council member
 * Returns true only if user exists in council_members with status='approved'
 */
export async function isApprovedCouncilMember(
  userId: string,
  supabase: SupabaseClient
): Promise<boolean> {
  const member = await getCouncilMemberStatus(userId, supabase)
  return member !== null && member.status === 'approved'
}

export default { registerCouncilMember, getCouncilMemberStatus, updateCouncilMemberStatus, isApprovedCouncilMember }
