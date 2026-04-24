import type { Contact, Conversation, Message, Platform, Settings, WebhookLog } from '@/types/whatsapp'

const BASE_URL = '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: options?.body ? { 'Content-Type': 'application/json' } : undefined,
  })
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(body?.error || `API error: ${response.status}`)
  }
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
    deleteAll: (platform: Platform) =>
      request<{ success: boolean }>(`/contacts?platform=${platform}`, { method: 'DELETE' }),
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
  media: {
    upload: async (file: File): Promise<{ mediaId: string; filename: string; mimeType: string }> => {
      const formData = new FormData()
      formData.append('file', file)
      const response = await fetch(`${BASE_URL}/media/upload`, { method: 'POST', body: formData })
      if (!response.ok) throw new Error('Upload failed')
      return response.json()
    },
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
