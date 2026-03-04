import type { FastifyInstance } from 'fastify'
import { eq, desc } from 'drizzle-orm'
import { db } from '../db/index.js'
import { conversations, contacts, messages } from '../db/schema.js'
import type { Platform } from '../db/schema.js'

export async function conversationsRoutes(app: FastifyInstance) {
  app.get<{ Querystring: { platform?: string } }>('/', async (request) => {
    const platform = (request.query.platform || 'whatsapp') as Platform

    const convos = db
      .select({
        id: conversations.id,
        contactId: conversations.contactId,
        platform: conversations.platform,
        createdAt: conversations.createdAt,
        updatedAt: conversations.updatedAt,
        contactName: contacts.name,
        contactPhone: contacts.phoneNumber,
        contactAvatar: contacts.avatarUrl,
      })
      .from(conversations)
      .innerJoin(contacts, eq(conversations.contactId, contacts.id))
      .where(eq(conversations.platform, platform))
      .orderBy(desc(conversations.updatedAt))
      .all()

    return convos.map((convo) => {
      const lastMessage = db
        .select()
        .from(messages)
        .where(eq(messages.conversationId, convo.id))
        .orderBy(desc(messages.createdAt))
        .limit(1)
        .get()

      return {
        ...convo,
        lastMessage: lastMessage ?? null,
      }
    })
  })

  app.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const convo = db
      .select({
        id: conversations.id,
        contactId: conversations.contactId,
        platform: conversations.platform,
        createdAt: conversations.createdAt,
        updatedAt: conversations.updatedAt,
        contactName: contacts.name,
        contactPhone: contacts.phoneNumber,
        contactAvatar: contacts.avatarUrl,
      })
      .from(conversations)
      .innerJoin(contacts, eq(conversations.contactId, contacts.id))
      .where(eq(conversations.id, Number(request.params.id)))
      .get()

    if (!convo) return reply.status(404).send({ error: 'Conversation not found' })
    return convo
  })
}
