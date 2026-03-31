import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { Conversation, Platform } from '@/types/whatsapp'

interface Props {
  platform: Platform
  activeId: number | null
  onSelect: (id: number) => void
  onSettingsClick: () => void
  onLogsClick: () => void
  onTestsClick: () => void
  onBack: () => void
}

export default function ContactList({ platform, activeId, onSelect, onSettingsClick, onLogsClick, onTestsClick, onBack }: Props) {
  const queryClient = useQueryClient()
  const [showNewContact, setShowNewContact] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [createError, setCreateError] = useState('')

  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations', platform],
    queryFn: () => api.conversations.list(platform),
  })

  const createContact = useMutation({
    mutationFn: (data: { name: string; phoneNumber: string }) => api.contacts.create({ ...data, platform }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      setShowNewContact(false)
      setNewName('')
      setNewPhone('')
      setCreateError('')
    },
    onError: (error: Error) => {
      setCreateError(error.message)
    },
  })

  function getMessagePreview(convo: Conversation) {
    if (!convo.lastMessage) return 'No messages yet'
    try {
      const payload = JSON.parse(convo.lastMessage.payload)
      if (convo.lastMessage.type === 'text') {
        const body = payload.body ?? payload.text?.body
        return body ? (convo.lastMessage.direction === 'outbound' ? `Bot: ${body}` : body) : '...'
      }
      return `[${convo.lastMessage.type}]`
    } catch {
      return '...'
    }
  }

  function formatTime(dateStr: string) {
    const date = new Date(dateStr)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="flex h-full w-80 flex-col border-r border-gray-200 bg-app-sidebar">
      {/* Header */}
      <div className="flex items-center justify-between bg-app-header px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="rounded p-1 text-white/80 hover:text-white hover:bg-white/10"
            title="Back to platforms"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-white">Chat Sim</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onTestsClick}
            className="rounded p-1.5 text-white/80 hover:text-white hover:bg-white/10"
            title="Test Scripts"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          <button
            onClick={onLogsClick}
            className="rounded p-1.5 text-white/80 hover:text-white hover:bg-white/10"
            title="Webhook Logs"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </button>
          <button
            onClick={onSettingsClick}
            className="rounded p-1.5 text-white/80 hover:text-white hover:bg-white/10"
            title="Settings"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {conversations.map((convo) => (
          <button
            key={convo.id}
            onClick={() => onSelect(convo.id)}
            className={`flex w-full items-center gap-3 border-b border-gray-100 px-4 py-3 text-left transition-colors hover:bg-gray-50 ${
              activeId === convo.id ? 'bg-gray-100' : ''
            }`}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-app-primary text-white font-semibold">
              {convo.contactName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900 truncate">{convo.contactName}</span>
                {convo.lastMessage && (
                  <span className="text-xs text-gray-500">{formatTime(convo.lastMessage.createdAt)}</span>
                )}
              </div>
              <p className="text-sm text-gray-500 truncate">{getMessagePreview(convo)}</p>
            </div>
          </button>
        ))}
      </div>

      {/* New Contact */}
      {showNewContact ? (
        <div className="border-t border-gray-200 p-3">
          <input
            type="text"
            placeholder="Name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="mb-2 w-full rounded border border-gray-300 px-3 py-1.5 text-sm focus:border-app-primary focus:outline-none"
          />
          <input
            type="text"
            placeholder="Phone number"
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
            className="mb-2 w-full rounded border border-gray-300 px-3 py-1.5 text-sm focus:border-app-primary focus:outline-none"
          />
          {createError && (
            <p className="mb-2 text-xs text-red-600">{createError}</p>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => createContact.mutate({ name: newName, phoneNumber: newPhone })}
              disabled={!newName || !newPhone}
              className="flex-1 rounded bg-app-primary py-1.5 text-sm font-medium text-white hover:bg-app-primary/90 disabled:opacity-50"
            >
              Create
            </button>
            <button
              onClick={() => setShowNewContact(false)}
              className="flex-1 rounded border border-gray-300 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowNewContact(true)}
          className="border-t border-gray-200 px-4 py-3 text-sm font-medium text-app-primary hover:bg-gray-50"
        >
          + New Contact
        </button>
      )}
    </div>
  )
}
