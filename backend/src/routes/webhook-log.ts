import type { FastifyInstance } from 'fastify'
import { eq, desc } from 'drizzle-orm'
import { db } from '../db/index.js'
import { webhookLogs } from '../db/schema.js'

export async function webhookLogRoutes(app: FastifyInstance) {
  app.get('/', async () => {
    return db
      .select()
      .from(webhookLogs)
      .orderBy(desc(webhookLogs.createdAt))
      .limit(100)
      .all()
  })

  app.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const log = db
      .select()
      .from(webhookLogs)
      .where(eq(webhookLogs.id, Number(request.params.id)))
      .get()
    if (!log) return reply.status(404).send({ error: 'Log not found' })
    return log
  })

  app.delete('/', async () => {
    db.delete(webhookLogs).run()
    return { success: true }
  })
}
