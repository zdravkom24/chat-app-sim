import type { Contact, Conversation, Message, Platform, Settings, WebhookLog } from '@/types/whatsapp'

const BASE_URL = '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!response.ok) throw new Error(`API error: ${response.status}`)
  return response.json()
}

export const api = {
  contacts: {
    list: (platform: Platform) => request<Contact[]>(`/contacts?platform=${platform}`),
    create: (data: { name: string; phoneNumber: string; platform: Platform }) =>
      request<Contact>('/contacts', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: Partial<Contact>) =>
      request<Contact>(`/contacts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) =>
      request<{ success: boolean }>(`/contacts/${id}`, { method: 'DELETE' }),
  },
  conversations: {
    list: (platform: Platform) => request<Conversation[]>(`/conversations?platform=${platform}`),
    get: (id: number) => request<Conversation>(`/conversations/${id}`),
  },
  messages: {
    list: (conversationId: number) => request<Message[]>(`/messages/${conversationId}`),
    send: (data: { conversationId: number; type: string; content: Record<string, unknown> }) =>
      request<Message>('/messages/send', { method: 'POST', body: JSON.stringify(data) }),
  },
  settings: {
    get: () => request<Settings>('/settings'),
    update: (data: Partial<Settings>) =>
      request<Settings>('/settings', { method: 'PUT', body: JSON.stringify(data) }),
  },
  webhookLogs: {
    list: () => request<WebhookLog[]>('/webhook-logs'),
    clear: () => request<{ success: boolean }>('/webhook-logs', { method: 'DELETE' }),
  },
}
