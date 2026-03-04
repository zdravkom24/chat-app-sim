import type { FastifyInstance } from 'fastify'
import { eq, desc } from 'drizzle-orm'
import crypto from 'crypto'
import { db } from '../db/index.js'
import { messages, conversations, contacts } from '../db/schema.js'
import { broadcast } from '../services/websocket.js'
import { sendInboundWebhook } from '../services/webhook-sender.js'

export async function messagesRoutes(app: FastifyInstance) {
  app.get<{ Params: { conversationId: string } }>('/:conversationId', async (request) => {
    return db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, Number(request.params.conversationId)))
      .orderBy(messages.createdAt)
      .all()
  })

  app.post<{
    Body: {
      conversationId: number
      type: string
      content: Record<string, unknown>
    }
  }>('/send', async (request, reply) => {
    const { conversationId, type, content } = request.body

    const convo = db.select().from(conversations).where(eq(conversations.id, conversationId)).get()
    if (!convo) return reply.status(404).send({ error: 'Conversation not found' })

    const contact = db.select().from(contacts).where(eq(contacts.id, convo.contactId)).get()
    if (!contact) return reply.status(404).send({ error: 'Contact not found' })

    const wamid = `wamid.${crypto.randomBytes(16).toString('hex')}`

    const message = db.insert(messages).values({
      conversationId,
      wamid,
      direction: 'inbound',
      type,
      payload: JSON.stringify(content),
      status: 'sent',
    }).returning().get()

    db.update(conversations)
      .set({ updatedAt: new Date().toISOString() })
      .where(eq(conversations.id, conversationId))
      .run()

    broadcast('message:new', { message, conversationId })

    sendInboundWebhook(message, contact).catch((err) => {
      console.error('Webhook send error:', err)
    })

    return message
  })
}
