import crypto from 'crypto'

interface Contact {
  name: string
  phoneNumber: string
}

interface Settings {
  phone_number_id: string
  business_account_id: string
  display_phone_number: string
}

export function generateWamid(): string {
  return `wamid.${crypto.randomBytes(16).toString('hex')}`
}

export function buildInboundPayload(
  message: { wamid: string; type: string; payload: string },
  contact: Contact,
  settings: Settings,
) {
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const parsed = JSON.parse(message.payload)
  const messagePayload = buildMessageByType(message.type, parsed)

  return {
    object: 'whatsapp_business_account',
    entry: [
      {
        id: settings.business_account_id,
        changes: [
          {
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: settings.display_phone_number,
                phone_number_id: settings.phone_number_id,
              },
              contacts: [
                {
                  profile: { name: contact.name },
                  wa_id: contact.phoneNumber,
                },
              ],
              messages: [
                {
                  from: contact.phoneNumber,
                  id: message.wamid,
                  timestamp,
                  type: message.type,
                  ...messagePayload,
                },
              ],
            },
            field: 'messages',
          },
        ],
      },
    ],
  }
}

function buildMessageByType(type: string, content: Record<string, unknown>) {
  switch (type) {
    case 'text':
      return { text: { body: content.body } }

    case 'interactive':
      return { interactive: content.interactive }

    case 'button':
      return { button: { payload: content.payload, text: content.text } }

    case 'image':
      return { image: { id: content.mediaId, caption: content.caption, mime_type: content.mimeType } }

    case 'video':
      return { video: { id: content.mediaId, caption: content.caption, mime_type: content.mimeType } }

    case 'audio':
      return { audio: { id: content.mediaId, mime_type: content.mimeType } }

    case 'document':
      return { document: { id: content.mediaId, caption: content.caption, mime_type: content.mimeType, filename: content.filename } }

    case 'sticker':
      return { sticker: { id: content.mediaId, mime_type: content.mimeType } }

    default:
      return { text: { body: JSON.stringify(content) } }
  }
}

export function buildStatusPayload(
  wamid: string,
  recipientPhone: string,
  status: string,
  settings: Settings,
) {
  return {
    object: 'whatsapp_business_account',
    entry: [
      {
        id: settings.business_account_id,
        changes: [
          {
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: settings.display_phone_number,
                phone_number_id: settings.phone_number_id,
              },
              statuses: [
                {
                  id: wamid,
                  status,
                  timestamp: Math.floor(Date.now() / 1000).toString(),
                  recipient_id: recipientPhone,
                },
              ],
            },
            field: 'messages',
          },
        ],
      },
    ],
  }
}
