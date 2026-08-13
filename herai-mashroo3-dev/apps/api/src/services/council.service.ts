import { SupabaseClient } from '@supabase/supabase-js'

export type CouncilMemberResponse = {
  id: string
  user_id: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

/**
 * Register a new Council member.
 * The caller must already be authenticated (user_id comes from authMiddleware).
 * This simply creates the council_members row with status='pending'.
 */
export async function registerCouncilMember(
  user_id: string,
  supabase: SupabaseClient
): Promise<CouncilMemberResponse> {
  const { data, error } = await supabase
    .from('council_members')
    .insert([{ user_id, status: 'pending' }])
    .select()
    .single()

  if (error) {
    throw new Error(`Council registration failed: ${error.message}`)
  }

  return {
    id: data.id,
    user_id: data.user_id,
    status: data.status,
    created_at: data.created_at,
  }
}

/**
 * Get council member status.
 * Returns the council membership record and status, or null if not found.
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
 * Approve or reject a council member application.
 * Signature matches council.routes.ts call: (user_id, status, supabase).
 */
export async function updateCouncilMemberStatus(
  user_id: string,
  status: 'approved' | 'rejected',
  supabase: SupabaseClient
): Promise<CouncilMemberResponse> {
  const updatePayload: Record<string, unknown> = { status }
  if (status === 'approved') {
    updatePayload.approved_at = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('council_members')
    .update(updatePayload)
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
 * Check if a user is an approved council member.
 * Returns true only if user exists in council_members with status='approved'.
 */
export async function isApprovedCouncilMember(
  userId: string,
  supabase: SupabaseClient
): Promise<boolean> {
  const member = await getCouncilMemberStatus(userId, supabase)
  return member !== null && member.status === 'approved'
}

export default { registerCouncilMember, getCouncilMemberStatus, updateCouncilMemberStatus, isApprovedCouncilMember }
