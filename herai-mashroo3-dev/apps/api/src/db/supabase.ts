import { createClient, SupabaseClient } from '@supabase/supabase-js'

export function createSupabaseClient(supabaseUrl: string, serviceRoleKey: string): SupabaseClient {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing supabaseUrl or serviceRoleKey')
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  })
}

export default createSupabaseClient
