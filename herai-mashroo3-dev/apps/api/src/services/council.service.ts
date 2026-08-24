import { SupabaseClient } from '@supabase/supabase-js'
import getServerConfig from '../config/server.config'
import createSupabaseClient from '../db/supabase'

export type CouncilApplicationData = {
  motivation?: string
  experience?: string
  contribution?: string
  availability?: string
}

export type CouncilMemberResponse = {
  id: string
  user_id: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  motivation?: string
  experience?: string
  contribution?: string
  availability?: string
  user?: {
    first_name?: string
    last_name?: string
    email?: string
    domain?: string
    country?: string
    city?: string
    phone_number?: string
  }
}

/**
 * Register a new Council member.
 * The caller must already be authenticated (user_id comes from authMiddleware).
 * Stores council application data and sets status to 'pending'.
 */
export async function registerCouncilMember(
  user_id: string,
  supabase: SupabaseClient,
  applicationData?: CouncilApplicationData
): Promise<CouncilMemberResponse> {
  const cfg = getServerConfig()
  const adminClient = createSupabaseClient(
    cfg.SUPABASE_URL,
    cfg.SUPABASE_SERVICE_ROLE_KEY
  )

  const existing = await getCouncilMemberStatus(user_id, supabase)
  
  const insertOrUpdatePayload: Record<string, any> = {
    user_id,
    status: 'pending',
  }

  if (applicationData?.motivation) insertOrUpdatePayload.motivation = applicationData.motivation.trim()
  if (applicationData?.experience) insertOrUpdatePayload.experience = applicationData.experience.trim()
  if (applicationData?.contribution) insertOrUpdatePayload.contribution = applicationData.contribution.trim()
  if (applicationData?.availability) insertOrUpdatePayload.availability = applicationData.availability.trim()

  let data: any
  let error: any

  if (existing) {
    // If existing, update status back to pending and save new application answers
    const updateResult = await adminClient
      .from('council_members')
      .update(insertOrUpdatePayload)
      .eq('user_id', user_id)
      .select()
      .single()
    data = updateResult.data
    error = updateResult.error
  } else {
    const insertResult = await adminClient
      .from('council_members')
      .insert([insertOrUpdatePayload])
      .select()
      .single()
    data = insertResult.data
    error = insertResult.error
  }

  if (error) {
    // If column doesn't exist in council_members table, retry with base payload
    const baseResult = existing
      ? await adminClient.from('council_members').update({ status: 'pending' }).eq('user_id', user_id).select().single()
      : await adminClient.from('council_members').insert([{ user_id, status: 'pending' }]).select().single()
    
    if (baseResult.error) {
      throw new Error(`Council registration failed: ${baseResult.error.message}`)
    }
    data = baseResult.data
  }

  return {
    id: data.id,
    user_id: data.user_id,
    status: data.status,
    created_at: data.created_at,
    motivation: applicationData?.motivation || data.motivation,
    experience: applicationData?.experience || data.experience,
    contribution: applicationData?.contribution || data.contribution,
    availability: applicationData?.availability || data.availability,
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
  const cfg = getServerConfig()
  const adminClient = createSupabaseClient(
    cfg.SUPABASE_URL,
    cfg.SUPABASE_SERVICE_ROLE_KEY
  )

  const { data, error } = await adminClient
    .from('council_members')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    throw new Error(`Failed to get council member status: ${error.message}`)
  }

  if (!data) return null

  return {
    id: data.id,
    user_id: data.user_id,
    status: data.status,
    created_at: data.created_at,
    motivation: data.motivation,
    experience: data.experience,
    contribution: data.contribution,
    availability: data.availability,
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
  const cfg = getServerConfig()
  const adminClient = createSupabaseClient(
    cfg.SUPABASE_URL,
    cfg.SUPABASE_SERVICE_ROLE_KEY
  )

  const updatePayload: Record<string, unknown> = { status }
  if (status === 'approved') {
    updatePayload.approved_at = new Date().toISOString()
  }

  const { data, error } = await adminClient
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
    motivation: data.motivation,
    experience: data.experience,
    contribution: data.contribution,
    availability: data.availability,
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

/**
 * Get all council members, optionally filtered by status, enriched with user profile info.
 */
export async function getAllCouncilMembers(
  supabase: SupabaseClient,
  statusFilter?: 'pending' | 'approved' | 'rejected'
): Promise<CouncilMemberResponse[]> {
  const cfg = getServerConfig()
  const adminClient = createSupabaseClient(
    cfg.SUPABASE_URL,
    cfg.SUPABASE_SERVICE_ROLE_KEY
  )

  let query = adminClient.from('council_members').select('*')
  
  if (statusFilter) {
    query = query.eq('status', statusFilter)
  }

  const { data: members, error } = await query

  if (error) {
    throw new Error(`Failed to fetch council members: ${error.message}`)
  }

  if (!members || members.length === 0) {
    return []
  }

  // Fetch corresponding user profiles
  const userIds = members.map((m: any) => m.user_id).filter(Boolean)
  let userMap: Record<string, any> = {}

  if (userIds.length > 0) {
    const { data: usersData } = await adminClient
      .from('users')
      .select('id, first_name, last_name, email, domain, country, city, phone_number')
      .in('id', userIds)

    if (usersData) {
      usersData.forEach((u: any) => {
        userMap[u.id] = u
      })
    }
  }

  return members.map((row: any) => {
    const userProfile = userMap[row.user_id]
    return {
      id: row.id,
      user_id: row.user_id,
      status: row.status,
      created_at: row.created_at,
      motivation: row.motivation,
      experience: row.experience,
      contribution: row.contribution,
      availability: row.availability,
      user: userProfile
        ? {
            first_name: userProfile.first_name,
            last_name: userProfile.last_name,
            email: userProfile.email,
            domain: userProfile.domain,
            country: userProfile.country,
            city: userProfile.city,
            phone_number: userProfile.phone_number,
          }
        : undefined,
    }
  })
}

export default { registerCouncilMember, getCouncilMemberStatus, updateCouncilMemberStatus, isApprovedCouncilMember, getAllCouncilMembers }

