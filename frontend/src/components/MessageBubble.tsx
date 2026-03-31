import type { Message } from '@/types/whatsapp'
import InteractiveMessage from './InteractiveMessage'

interface Props {
  message: Message
  onInteraction: (type: string, content: Record<string, unknown>) => void
}

export default function MessageBubble({ message, onInteraction }: Props) {
  const isInbound = message.direction === 'inbound'
  let parsed: Record<string, unknown>

  try {
    parsed = JSON.parse(message.payload)
  } catch {
    parsed = {}
  }

  function renderContent() {
    switch (message.type) {
      case 'text': {
        const body = (parsed.body as string) ?? (parsed.text as { body: string })?.body ?? ''
        return <p className="whitespace-pre-wrap wrap-break-words">{body}</p>
      }

      case 'interactive': {
        const interactive = (parsed.interactive as Record<string, unknown>) ?? parsed
        return <InteractiveMessage interactive={interactive} onAction={onInteraction} />
      }

      case 'image': {
        // Try to get a displayable image URL
        const mediaId = (parsed.mediaId as string) ?? (parsed.image as Record<string, unknown>)?.id as string | undefined
        const imageCaption = (parsed.caption as string) ?? (parsed.image as Record<string, unknown>)?.caption as string | undefined ?? ''
        const imageUrl = mediaId ? `/api/media/${mediaId}/download` : null

        return (
          <div>
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={imageCaption || 'Image'}
                className="max-w-full rounded-md max-h-64 object-contain"
                loading="lazy"
              />
            ) : (
              <div className="flex items-center gap-2 text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm">Image</span>
              </div>
            )}
            {imageCaption && <p className="text-sm mt-1">{imageCaption}</p>}
          </div>
        )
      }

      case 'video':
        return (
          <div className="flex items-center gap-2 text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span className="text-sm">{(parsed.caption as string) || 'Video'}</span>
          </div>
        )

      case 'audio':
        return (
          <div className="flex items-center gap-2 text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
            <span className="text-sm">Audio message</span>
          </div>
        )

      case 'document':
        return (
          <div className="flex items-center gap-2 text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-sm">{(parsed.filename as string) || 'Document'}</span>
          </div>
        )

      case 'template':
        return <p className="text-sm text-gray-500 italic">[Template message]</p>

      default:
        return <p className="text-sm text-gray-500 italic">[{message.type}]</p>
    }
  }

  function renderStatus() {
    if (!isInbound) return null
    switch (message.status) {
      case 'sent':
        return <span className="text-gray-400" title="Sent">&#10003;</span>
      case 'delivered':
        return <span className="text-gray-400" title="Delivered">&#10003;&#10003;</span>
      case 'read':
        return <span className="text-blue-500" title="Read">&#10003;&#10003;</span>
      default:
        return null
    }
  }

  return (
    <div className={`flex ${isInbound ? 'justify-end' : 'justify-start'} mb-1`}>
      <div
        className={`max-w-[70%] rounded-lg px-3 py-1.5 shadow-sm ${
          isInbound ? 'bg-app-inbound' : 'bg-app-outbound'
        }`}
      >
        {renderContent()}
        <div className="mt-0.5 flex items-center justify-end gap-1">
          <span className="text-[11px] text-gray-500">
            {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {renderStatus()}
        </div>
      </div>
    </div>
  )
}
