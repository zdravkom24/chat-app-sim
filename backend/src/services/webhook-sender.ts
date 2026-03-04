import { eq } from 'drizzle-orm'
import { db } from '../db/index.js'
import { webhookLogs, settings } from '../db/schema.js'
import { buildInboundPayload } from './whatsapp-formatter.js'
import { broadcast } from './websocket.js'

interface Contact {
  name: string
  phoneNumber: string
}

interface Message {
  wamid: string
  type: string
  payload: string
}

function getSettings() {
  const rows = db.select().from(settings).all()
  const result: Record<string, string> = {}
  for (const row of rows) {
    result[row.key] = row.value
  }
  return result
}

export async function sendInboundWebhook(message: Message, contact: Contact) {
  const s = getSettings()
  const webhookUrl = s.webhook_url
  if (!webhookUrl) return

  const payload = buildInboundPayload(message, contact, {
    phone_number_id: s.phone_number_id,
    business_account_id: s.business_account_id,
    display_phone_number: s.display_phone_number,
  })

  const headers = { 'Content-Type': 'application/json' }
  const body = JSON.stringify(payload)

  const logEntry = db.insert(webhookLogs).values({
    direction: 'outgoing',
    url: webhookUrl,
    method: 'POST',
    headers: JSON.stringify(headers),
    body,
  }).returning().get()

  broadcast('webhook:new', logEntry)

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body,
    })

    const responseBody = await response.text()

    db.update(webhookLogs)
      .set({ responseStatus: response.status, responseBody })
      .where(eq(webhookLogs.id, logEntry.id))
      .run()
  } catch (error) {
    db.update(webhookLogs)
      .set({ responseStatus: 0, responseBody: String(error) })
      .where(eq(webhookLogs.id, logEntry.id))
      .run()
  }
}
