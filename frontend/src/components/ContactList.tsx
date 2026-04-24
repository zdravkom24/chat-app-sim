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
  onDelete: (conversationId: number) => void
  darkMode: boolean
  onToggleDarkMode: () => void
}

export default function ContactList({ platform, activeId, onSelect, onSettingsClick, onLogsClick, onTestsClick, onBack, onDelete, darkMode, onToggleDarkMode }: Props) {
  const queryClient = useQueryClient()
  const [showNewContact, setShowNewContact] = useState(false)
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [createError, setCreateError] = useState('')

  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations', platform],
    queryFn: () => api.conversations.list(platform),
  })

  const deleteContact = useMutation({
    mutationFn: (contactId: number) => api.contacts.delete(contactId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
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

  const deleteAllContacts = useMutation({
    mutationFn: () => api.contacts.deleteAll(platform),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      setShowDeleteAllModal(false)
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
    <div className="flex h-full w-80 flex-col border-r border-gray-200 dark:border-gray-700 bg-app-sidebar">
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
            onClick={onToggleDarkMode}
            className="rounded p-1.5 text-white/80 hover:text-white hover:bg-white/10"
            title={darkMode ? 'Light mode' : 'Dark mode'}
          >
            {darkMode ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
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
          <div
            key={convo.id}
            className={`group relative flex w-full items-center gap-3 border-b border-gray-100 dark:border-gray-700 px-4 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer ${
              activeId === convo.id ? 'bg-gray-100 dark:bg-white/10' : ''
            }`}
            onClick={() => onSelect(convo.id)}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-app-primary text-white font-semibold">
              {convo.contactName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900 dark:text-gray-100 truncate">{convo.contactName}</span>
                {convo.lastMessage && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">{formatTime(convo.lastMessage.createdAt)}</span>
                )}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{getMessagePreview(convo)}</p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                if (window.confirm(`Delete "${convo.contactName}" and all their messages?`)) {
                  onDelete(convo.id)
                  deleteContact.mutate(convo.contactId)
                }
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 rounded p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all"
              title="Delete conversation"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* New Contact */}
      {showNewContact ? (
        <div className="border-t border-gray-200 dark:border-gray-700 p-3">
          <input
            type="text"
            placeholder="Name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="mb-2 w-full rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 px-3 py-1.5 text-sm focus:border-app-primary focus:outline-none"
          />
          <input
            type="text"
            placeholder="Phone number"
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
            className="mb-2 w-full rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 px-3 py-1.5 text-sm focus:border-app-primary focus:outline-none"
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
              className="flex-1 rounded border border-gray-300 dark:border-gray-600 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setShowNewContact(true)}
            className="flex-1 px-4 py-3 text-sm font-medium text-app-primary hover:bg-gray-50 dark:hover:bg-white/5"
          >
            + New Contact
          </button>
          {conversations.length > 0 && (
            <button
              onClick={() => setShowDeleteAllModal(true)}
              className="px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 border-l border-gray-200 dark:border-gray-700"
            >
              Delete All
            </button>
          )}
        </div>
      )}

      {/* Delete All Confirmation Modal */}
      {showDeleteAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowDeleteAllModal(false)}>
          <div className="mx-4 w-full max-w-sm rounded-lg bg-white dark:bg-gray-800 p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Delete All Chats</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Are you sure you want to delete all contacts and their messages? This action cannot be undone.
            </p>
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteAllModal(false)}
                className="rounded px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                No
              </button>
              <button
                onClick={() => deleteAllContacts.mutate()}
                disabled={deleteAllContacts.isPending}
                className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleteAllContacts.isPending ? 'Deleting...' : 'Yes, Delete All'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
