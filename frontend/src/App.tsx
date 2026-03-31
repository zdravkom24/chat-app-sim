import { useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useWebSocket } from '@/hooks/useWebSocket'
import PlatformSelect from '@/components/PlatformSelect'
import type { Platform } from '@/types/whatsapp'
import ContactList from '@/components/ContactList'
import ChatWindow from '@/components/ChatWindow'
import Settings from '@/components/Settings'
import WebhookLogViewer from '@/components/WebhookLogViewer'
import TestScripts from '@/components/TestScripts'

export default function App() {
  const [platform, setPlatform] = useState<Platform | null>(null)
  const [activeConversation, setActiveConversation] = useState<number | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [showWebhookLogs, setShowWebhookLogs] = useState(false)
  const [showTestScripts, setShowTestScripts] = useState(false)
  const queryClient = useQueryClient()
  const { on } = useWebSocket()

  useEffect(() => {
    if (platform) {
      document.documentElement.setAttribute('data-theme', platform)
    } else {
      document.documentElement.removeAttribute('data-theme')
    }
  }, [platform])

  useEffect(() => {
    const unsub1 = on('message:new', () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] })
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    })

    const unsub2 = on('message:status', () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] })
    })

    const unsub3 = on('webhook:new', () => {
      queryClient.invalidateQueries({ queryKey: ['webhookLogs'] })
    })

    return () => {
      unsub1()
      unsub2()
      unsub3()
    }
  }, [on, queryClient])

  if (!platform) {
    return <PlatformSelect onSelect={setPlatform} />
  }

  return (
    <div className="flex h-screen">
      <ContactList
        platform={platform}
        activeId={activeConversation}
        onSelect={setActiveConversation}
        onSettingsClick={() => setShowSettings(true)}
        onLogsClick={() => setShowWebhookLogs(true)}
        onTestsClick={() => setShowTestScripts(true)}
        onBack={() => { setPlatform(null); setActiveConversation(null) }}
      />
      <ChatWindow conversationId={activeConversation} />
      {showSettings && <Settings onClose={() => setShowSettings(false)} />}
      {showWebhookLogs && <WebhookLogViewer onClose={() => setShowWebhookLogs(false)} />}
      {showTestScripts && <TestScripts onClose={() => setShowTestScripts(false)} />}
    </div>
  )
}
