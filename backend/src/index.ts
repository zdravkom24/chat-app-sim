import Fastify from 'fastify'
import websocket from '@fastify/websocket'
import cors from '@fastify/cors'
import multipart from '@fastify/multipart'
import { runMigrations } from './db/migrate.js'
import { registerWebSocket } from './services/websocket.js'
import { contactsRoutes } from './routes/contacts.js'
import { conversationsRoutes } from './routes/conversations.js'
import { messagesRoutes } from './routes/messages.js'
import { settingsRoutes } from './routes/settings.js'
import { webhookLogRoutes } from './routes/webhook-log.js'
import { mockWhatsappRoutes } from './routes/mock-whatsapp.js'
import { mediaRoutes } from './routes/media.js'

const app = Fastify({ logger: true })

async function start() {
  runMigrations()

  await app.register(cors, { origin: true })
  await app.register(websocket)
  await app.register(multipart, { limits: { fileSize: 10 * 1024 * 1024 } }) // 10MB max

  registerWebSocket(app)

  app.get('/api/health', async () => ({ status: 'ok' }))

  await app.register(contactsRoutes, { prefix: '/api/contacts' })
  await app.register(conversationsRoutes, { prefix: '/api/conversations' })
  await app.register(messagesRoutes, { prefix: '/api/messages' })
  await app.register(settingsRoutes, { prefix: '/api/settings' })
  await app.register(webhookLogRoutes, { prefix: '/api/webhook-logs' })

  await app.register(mediaRoutes, { prefix: '/api/media' })
  await app.register(mockWhatsappRoutes, { prefix: '/v22.0' })

  await app.listen({ port: 3000, host: '0.0.0.0' })
}

start()
