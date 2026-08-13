// Server-only config helpers. Import these from server entry points only.

export function getServerConfig() {
  // Access env vars here at runtime in server code only.
  return {
    SUPABASE_URL: process.env.SUPABASE_URL || '',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
    COUNCIL_SHARED_TOKEN: process.env.COUNCIL_SHARED_TOKEN || '',
  }
}

export default getServerConfig
