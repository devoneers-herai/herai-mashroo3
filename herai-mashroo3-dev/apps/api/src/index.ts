// Load .env file manually
import fs from 'fs'
import path from 'path'

const envPath = path.join(__dirname, '..', '.env')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8')
  envContent.split('\n').forEach((line) => {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...rest] = trimmed.split('=')
      if (key) {
        process.env[key.trim()] = rest.join('=').trim()
      }
    }
  })
}

import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import authRoutes from './routes/auth.routes'
import chatRoutes from './routes/chat.routes'
import councilRoutes from './routes/council.routes'
import getServerConfig from './config/server.config'
import createSupabaseClient from './db/supabase'

async function main() {
  const cfg = getServerConfig()
  const supabase = createSupabaseClient(cfg.SUPABASE_URL, cfg.SUPABASE_SERVICE_ROLE_KEY)

 const app = express()

app.use(
  cors({
    origin: 'http://localhost:3000',
  })
)

app.use(bodyParser.json())

  // attach dependencies to request (simple DI)
  app.use((req, _res, next) => {
    // create a fresh client per request to avoid polluting global auth state across requests
    const reqSupabase = createSupabaseClient(cfg.SUPABASE_URL, cfg.SUPABASE_SERVICE_ROLE_KEY)
    ;(req as any).services = { supabase: reqSupabase, OPENAI_API_KEY: cfg.OPENAI_API_KEY }
    next()
  })

  app.use('/api/auth', authRoutes)
  app.use('/api/chat', chatRoutes)
  app.use('/api/council', councilRoutes)

  const port = process.env.PORT || 4000
  app.listen(port, () => console.log(`API listening on ${port}`))
}

main().catch((err) => {
  console.error('Failed to start server', err)
  process.exit(1)
})
