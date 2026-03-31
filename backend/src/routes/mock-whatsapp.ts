import type { FastifyInstance } from 'fastify'
import { eq, and } from 'drizzle-orm'
import crypto from 'crypto'
import { db } from '../db/index.js'
import { contacts, conversations, messages, webhookLogs } from '../db/schema.js'
import { broadcast } from '../services/websocket.js'
import { fireStatusWebhooks } from '../services/status-webhook.js'

// TODO: Z - This file handles the WhatsApp Cloud API mock only.
// When adding new platforms (Viber, Facebook, Instagram, Telegram),
// create separate route files per platform (mock-viber.ts, mock-facebook.ts)
// that register under their own prefixes and set platform.

export async function mockWhatsappRoutes(app: FastifyInstance) {
  // POST /:phoneNumberId/messages — receive outbound messages from target API
  app.post<{
    Params: { phoneNumberId: string }
    Body: {
      messaging_product: string
      to?: string
      status?: string
      message_id?: string
      type?: string
      text?: { body: string }
      interactive?: Record<string, unknown>
      image?: Record<string, unknown>
      video?: Record<string, unknown>
      audio?: Record<string, unknown>
      document?: Record<string, unknown>
      template?: Record<string, unknown>
      typing_indicator?: Record<string, unknown>
    }
  }>('/:phoneNumberId/messages', async (request, reply) => {
    const body = request.body

    // Handle status updates (mark as read, typing indicator)
    if (body.status === 'read' && body.message_id) {
      // Update message status in DB
      const msg = db.select().from(messages)
        .where(eq(messages.wamid, body.message_id))
        .get()
      if (msg) {
        db.update(messages)
          .set({ status: 'read' })
          .where(eq(messages.wamid, body.message_id))
          .run()
        broadcast('message:status', { wamid: body.message_id, status: 'read' })
      }
      return { success: true }
    }

    // Handle typing indicator — don't store as a message
    if (body.typing_indicator) {
      const typingPhone = body.to
      if (typingPhone) {
        broadcast('typing:start', { contactPhone: typingPhone })
      }
      return { success: true }
    }

    const recipientPhone = body.to
    if (!recipientPhone) {
      return reply.status(400).send({ error: 'Missing "to" field' })
    }

    const messageType = body.type || 'text'
    const wamid = `wamid.${crypto.randomBytes(16).toString('hex')}`

    // Log incoming mock API call
    const logEntry = db.insert(webhookLogs).values({
      direction: 'incoming',
      url: request.url,
      method: 'POST',
      headers: JSON.stringify(request.headers),
      body: JSON.stringify(body),
      responseStatus: 200,
    }).returning().get()

    broadcast('webhook:new', logEntry)

    // Find contact by phone number scoped to whatsapp platform
    let contact = db.select().from(contacts)
      .where(and(eq(contacts.phoneNumber, recipientPhone), eq(contacts.platform, 'whatsapp')))
      .get()

    // auto-create contact if doesn't exist
    if (!contact) {
      contact = db.insert(contacts).values({
        name: recipientPhone,
        phoneNumber: recipientPhone,
        platform: 'whatsapp',
      }).returning().get()

      db.insert(conversations).values({
        contactId: contact.id,
        platform: 'whatsapp',
      }).run()
    }

    // find conversation for this contact on whatsapp
    const convo = db.select().from(conversations)
      .where(and(eq(conversations.contactId, contact.id), eq(conversations.platform, 'whatsapp')))
      .get()
    if (!convo) {
      return reply.status(400).send({ error: 'No conversation found' })
    }

    // store as outbound message
    const message = db.insert(messages).values({
      conversationId: convo.id,
      wamid,
      direction: 'outbound',
      type: messageType,
      payload: JSON.stringify(body),
      status: 'sent',
    }).returning().get()

    // update conversation timestamp
    db.update(conversations)
      .set({ updatedAt: new Date().toISOString() })
      .where(eq(conversations.id, convo.id))
      .run()

    // push to frontend + stop typing indicator
    broadcast('message:new', { message, conversationId: convo.id })
    broadcast('typing:stop', { contactPhone: recipientPhone })

    // fire status webhooks asynchronously
    fireStatusWebhooks(wamid, recipientPhone).catch((err) => {
      console.error('Status webhook error:', err)
    })

    return {
      messaging_product: 'whatsapp',
      contacts: [{ input: recipientPhone, wa_id: recipientPhone }],
      messages: [{ id: wamid }],
    }
  })

  // GET /:mediaId - media metadata retrieval
  app.get<{ Params: { mediaId: string } }>('/:mediaId', async (request) => {
    // Use the request host so callers (including Docker containers) can reach the download URL
    const host = request.headers.host || 'localhost:3000'
    const protocol = request.protocol || 'http'
    return {
      url: `${protocol}://${host}/api/media/${request.params.mediaId}/download`,
      mime_type: 'image/jpeg',
      sha256: crypto.randomBytes(32).toString('hex'),
      file_size: 0,
      id: request.params.mediaId,
    }
  })
}
