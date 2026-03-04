import type { FastifyInstance } from 'fastify'
import { eq } from 'drizzle-orm'
import { db } from '../db/index.js'
import { settings } from '../db/schema.js'

export async function settingsRoutes(app: FastifyInstance) {
  app.get('/', async () => {
    const rows = db.select().from(settings).all()
    const result: Record<string, string> = {}
    for (const row of rows) {
      result[row.key] = row.value
    }
    return result
  })

  app.put<{ Body: Record<string, string> }>('/', async (request) => {
    const entries = request.body

    for (const [key, value] of Object.entries(entries)) {
      const existing = db.select().from(settings).where(eq(settings.key, key)).get()
      if (existing) {
        db.update(settings).set({ value }).where(eq(settings.key, key)).run()
      } else {
        db.insert(settings).values({ key, value }).run()
      }
    }

    // Return updated settings
    const rows = db.select().from(settings).all()
    const result: Record<string, string> = {}
    for (const row of rows) {
      result[row.key] = row.value
    }
    return result
  })
}
