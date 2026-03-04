import { eq } from 'drizzle-orm'
import { db } from '../db/index.js'
import { messages, webhookLogs, settings } from '../db/schema.js'
import { buildStatusPayload } from './whatsapp-formatter.js'
import { broadcast } from './websocket.js'

function getSettings() {
  const rows = db.select().from(settings).all()
  const result: Record<string, string> = {}
  for (const row of rows) {
    result[row.key] = row.value
  }
  return result
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function fireStatusWebhooks(wamid: string, recipientPhone: string) {
  const s = getSettings()
  if (s.auto_status_webhooks !== 'true') return

  const webhookUrl = s.webhook_url
  if (!webhookUrl) return

  const statusSettings = {
    phone_number_id: s.phone_number_id,
    business_account_id: s.business_account_id,
    display_phone_number: s.display_phone_number,
  }

  const statuses = ['sent', 'delivered', 'read'] as const

  for (const [index, status] of statuses.entries()) {
    await delay(500 * (index + 1))

    const payload = buildStatusPayload(wamid, recipientPhone, status, statusSettings)
    const body = JSON.stringify(payload)

    const logEntry = db.insert(webhookLogs).values({
      direction: 'outgoing',
      url: webhookUrl,
      method: 'POST',
      headers: JSON.stringify({ 'Content-Type': 'application/json' }),
      body,
    }).returning().get()

    broadcast('webhook:new', logEntry)

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      })

      db.update(webhookLogs)
        .set({ responseStatus: response.status, responseBody: await response.text() })
        .where(eq(webhookLogs.id, logEntry.id))
        .run()
    } catch (error) {
      db.update(webhookLogs)
        .set({ responseStatus: 0, responseBody: String(error) })
        .where(eq(webhookLogs.id, logEntry.id))
        .run()
    }

    // Update message status in our DB
    db.update(messages)
      .set({ status })
      .where(eq(messages.wamid, wamid))
      .run()

    broadcast('message:status', { wamid, status })
  }
}
