import { useEffect, useRef, useCallback } from 'react'

type EventHandler = (data: unknown) => void

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null)
  const handlersRef = useRef<Map<string, Set<EventHandler>>>(new Map())

  useEffect(() => {
    function connect() {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const ws = new WebSocket(`${protocol}//${window.location.host}/api/ws`)
      wsRef.current = ws

      ws.onmessage = (event) => {
        try {
          const { event: eventName, data } = JSON.parse(event.data)
          const handlers = handlersRef.current.get(eventName)
          if (handlers) {
            for (const handler of handlers) handler(data)
          }
        } catch {
          // ignore malformed messages
        }
      }

      ws.onclose = () => {
        setTimeout(connect, 2000)
      }

      ws.onerror = () => {
        ws.close()
      }
    }

    connect()

    return () => {
      wsRef.current?.close()
    }
  }, [])

  const on = useCallback((event: string, handler: EventHandler) => {
    if (!handlersRef.current.has(event)) {
      handlersRef.current.set(event, new Set())
    }
    handlersRef.current.get(event)!.add(handler)

    return () => {
      handlersRef.current.get(event)?.delete(handler)
    }
  }, [])

  return { on }
}
