import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import { useWebSocket } from '@/hooks/useWebSocket'
import MessageBubble from './MessageBubble'

interface Props {
  conversationId: number | null
}

export default function ChatWindow({ conversationId }: Props) {
  const queryClient = useQueryClient()
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { on } = useWebSocket()

  const { data: conversation } = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: () => api.conversations.get(conversationId!),
    enabled: !!conversationId,
  })

  const { data: messages = [] } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => api.messages.list(conversationId!),
    enabled: !!conversationId,
    refetchInterval: 2000,
  })

  const sendMessage = useMutation({
    mutationFn: (data: { conversationId: number; type: string; content: Record<string, unknown> }) =>
      api.messages.send(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] })
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })

  // Listen for typing events
  useEffect(() => {
    if (!conversation) return

    const unsubStart = on('typing:start', (data: unknown) => {
      const { contactPhone } = data as { contactPhone: string }
      if (contactPhone === conversation.contactPhone) {
        setIsTyping(true)
      }
    })

    const unsubStop = on('typing:stop', (data: unknown) => {
      const { contactPhone } = data as { contactPhone: string }
      if (contactPhone === conversation.contactPhone) {
        setIsTyping(false)
      }
    })

    // Also stop typing when new outbound message arrives
    const unsubMsg = on('message:new', (data: unknown) => {
      const { message } = data as { message: { direction: string }; conversationId: number }
      if (message.direction === 'outbound') {
        setIsTyping(false)
      }
    })

    return () => {
      unsubStart()
      unsubStop()
      unsubMsg()
    }
  }, [conversation, on])

  // Reset typing when conversation changes
  useEffect(() => {
    setIsTyping(false)
  }, [conversationId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  function handleSend() {
    if (!input.trim() || !conversationId) return
    sendMessage.mutate({
      conversationId,
      type: 'text',
      content: { body: input.trim() },
    })
    setInput('')
  }

  function handleInteraction(type: string, content: Record<string, unknown>) {
    if (!conversationId) return
    sendMessage.mutate({ conversationId, type, content })
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !conversationId) return

    try {
      const { mediaId, mimeType } = await api.media.upload(file)
      const isImage = file.type.startsWith('image/')

      sendMessage.mutate({
        conversationId,
        type: isImage ? 'image' : 'document',
        content: {
          mediaId,
          caption: '',
          mimeType,
          ...(isImage ? {} : { filename: file.name }),
        },
      })
    } catch (err) {
      console.error('File upload failed:', err)
    }

    // Reset input so same file can be re-selected
    e.target.value = ''
  }

  if (!conversationId) {
    return (
      <div className="flex flex-1 items-center justify-center bg-gray-50">
        <div className="text-center text-gray-400">
          <p className="text-lg">Select a conversation to start chatting</p>
          <p className="mt-1 text-sm">Or create a new contact</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 bg-app-header px-4 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white text-sm font-semibold">
          {conversation?.contactName?.charAt(0).toUpperCase() ?? '?'}
        </div>
        <div>
          <div className="font-medium text-white">{conversation?.contactName}</div>
          <div className="text-xs text-white/70">
            {isTyping ? (
              <span className="italic">typing...</span>
            ) : (
              conversation?.contactPhone
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-app-chat-bg p-4" style={{
        backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23c5beb5\' fill-opacity=\'0.15\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
      }}>
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} onInteraction={handleInteraction} />
        ))}
        {isTyping && (
          <div className="flex justify-start mb-1">
            <div className="bg-app-outbound rounded-lg px-4 py-2 shadow-sm">
              <div className="flex gap-1 items-center">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 border-t border-gray-200 bg-gray-50 px-4 py-2">
        {/* Attachment button */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,.doc,.docx"
          onChange={handleFileSelect}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-200"
          title="Attach file"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
        </button>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type a message..."
          className="flex-1 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm focus:border-app-primary focus:outline-none"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim()}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-app-primary text-white hover:bg-app-primary/90 disabled:opacity-50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </div>
    </div>
  )
}
