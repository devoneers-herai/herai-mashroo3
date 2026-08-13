import express from 'express'
import bodyParser from 'body-parser'
import authRoutes from './routes/auth.routes'
import chatRoutes from './routes/chat.routes'
import councilRoutes from './routes/council.routes'
import getServerConfig from './config/server.config'
import createSupabaseClient from './db/supabase'

async function main() {
  const cfg = getServerConfig()
  const supabase = createSupabaseClient(cfg.SUPABASE_URL, cfg.SUPABASE_SERVICE_ROLE_KEY)

  const app = express()
  app.use(bodyParser.json())

  // attach dependencies to request (simple DI)
  app.use((req, _res, next) => {
    ;(req as any).services = { supabase, OPENAI_API_KEY: cfg.OPENAI_API_KEY }
    next()
  })

  app.use('/api/auth', authRoutes)
  app.use('/api/chat', chatRoutes)
  app.use('/api/council', councilRoutes)

  const port = process.env.PORT || 3000
  app.listen(port, () => console.log(`API listening on ${port}`))
}

main().catch((err) => {
  console.error('Failed to start server', err)
  process.exit(1)
})
