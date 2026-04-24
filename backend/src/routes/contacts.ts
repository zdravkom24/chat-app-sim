import type { FastifyInstance } from 'fastify'
import { eq, and, inArray } from 'drizzle-orm'
import { db } from '../db/index.js'
import { contacts, conversations, messages } from '../db/schema.js'
import type { Platform } from '../db/schema.js'

export async function contactsRoutes(app: FastifyInstance) {
  app.get<{ Querystring: { platform?: string } }>('/', async (request) => {
    const platform = (request.query.platform || 'whatsapp') as Platform
    return db.select().from(contacts).where(eq(contacts.platform, platform)).all()
  })

  app.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const contact = db.select().from(contacts).where(eq(contacts.id, Number(request.params.id))).get()
    if (!contact) return reply.status(404).send({ error: 'Contact not found' })
    return contact
  })

  app.post<{ Body: { name: string; phoneNumber: string; avatarUrl?: string; platform?: string } }>('/', async (request, reply) => {
    const { name, phoneNumber, avatarUrl, platform: p } = request.body
    const platform = (p || 'whatsapp') as Platform

    const existing = db.select().from(contacts)
      .where(and(eq(contacts.phoneNumber, phoneNumber), eq(contacts.platform, platform)))
      .get()

    if (existing) {
      return reply.status(409).send({ error: 'Contact with this phone number already exists on this platform' })
    }

    const contact = db.insert(contacts).values({
      name,
      phoneNumber,
      platform,
      avatarUrl: avatarUrl ?? null,
    }).returning().get()

    // Auto-create conversation for this contact
    db.insert(conversations).values({
      contactId: contact.id,
      platform,
    }).run()

    return contact
  })

  app.put<{ Params: { id: string }; Body: { name?: string; phoneNumber?: string; avatarUrl?: string } }>(
    '/:id',
    async (request, reply) => {
      const id = Number(request.params.id)
      const existing = db.select().from(contacts).where(eq(contacts.id, id)).get()
      if (!existing) return reply.status(404).send({ error: 'Contact not found' })

      const updated = db.update(contacts)
        .set(request.body)
        .where(eq(contacts.id, id))
        .returning()
        .get()

      return updated
    },
  )

  app.delete<{ Querystring: { platform?: string } }>('/', async (request) => {
    const platform = (request.query.platform || 'whatsapp') as Platform
    const allContacts = db.select({ id: contacts.id }).from(contacts).where(eq(contacts.platform, platform)).all()
    const contactIds = allContacts.map(c => c.id)
    if (contactIds.length > 0) {
      const convos = db.select({ id: conversations.id })
        .from(conversations)
        .where(inArray(conversations.contactId, contactIds))
        .all()
      const convIds = convos.map(c => c.id)
      if (convIds.length > 0) {
        db.delete(messages).where(inArray(messages.conversationId, convIds)).run()
      }
      db.delete(conversations).where(inArray(conversations.contactId, contactIds)).run()
      db.delete(contacts).where(inArray(contacts.id, contactIds)).run()
    }
    return { success: true }
  })

  app.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const id = Number(request.params.id)
    const existing = db.select().from(contacts).where(eq(contacts.id, id)).get()
    if (!existing) return reply.status(404).send({ error: 'Contact not found' })

    // Cascade delete: messages → conversations → contact
    const convos = db.select({ id: conversations.id })
      .from(conversations)
      .where(eq(conversations.contactId, id))
      .all()
    const convIds = convos.map(c => c.id)
    if (convIds.length > 0) {
      db.delete(messages).where(inArray(messages.conversationId, convIds)).run()
    }
    db.delete(conversations).where(eq(conversations.contactId, id)).run()
    db.delete(contacts).where(eq(contacts.id, id)).run()
    return { success: true }
  })
}
