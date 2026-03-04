export type Platform = 'whatsapp' | 'viber' | 'facebook' | 'instagram' | 'telegram'

export interface Contact {
  id: number
  name: string
  phoneNumber: string
  platform: Platform
  avatarUrl: string | null
  createdAt: string
}

export interface Conversation {
  id: number
  contactId: number
  platform: Platform
  createdAt: string
  updatedAt: string
  contactName: string
  contactPhone: string
  contactAvatar: string | null
  lastMessage: Message | null
}

export interface Message {
  id: number
  conversationId: number
  wamid: string
  direction: 'inbound' | 'outbound'
  type: string
  payload: string
  status: 'sent' | 'delivered' | 'read'
  createdAt: string
}

export interface WebhookLog {
  id: number
  direction: 'outgoing' | 'incoming'
  url: string
  method: string
  headers: string
  body: string
  responseStatus: number | null
  responseBody: string | null
  createdAt: string
}

export interface Settings {
  webhook_url: string
  verify_token: string
  phone_number_id: string
  business_account_id: string
  display_phone_number: string
  auto_status_webhooks: string
}

// Parsed payload types for outbound interactive messages
export interface InteractiveButtonPayload {
  type: 'button'
  body: { text: string }
  action: {
    buttons: Array<{
      type: 'reply'
      reply: { id: string; title: string }
    }>
  }
}

export interface InteractiveListPayload {
  type: 'list'
  body: { text: string }
  action: {
    button: string
    sections: Array<{
      title: string
      rows: Array<{ id: string; title: string; description?: string }>
    }>
  }
}
