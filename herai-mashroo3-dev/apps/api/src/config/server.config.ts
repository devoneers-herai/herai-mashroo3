// Server-only config helpers. Import these from server entry points only.

export function getServerConfig() {
  // Access env vars here at runtime in server code only.
  return {
    SUPABASE_URL: process.env.SUPABASE_URL || '',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
    OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    BACKUP_AI_KEY:
      process.env.BACKUP_AI_KEY ||
      process.env.GROQ_API_KEY ||
      process.env.GROK_API_KEY ||
      '',
    BACKUP_AI_MODEL: process.env.BACKUP_AI_MODEL || 'allam-2-7b',
    GROQ_API_KEY: process.env.GROQ_API_KEY || process.env.BACKUP_AI_KEY || '',
    GROK_API_KEY: process.env.GROK_API_KEY || process.env.BACKUP_AI_KEY || '',
    COUNCIL_SHARED_TOKEN: process.env.COUNCIL_SHARED_TOKEN || '',
  }
}

export default getServerConfig
