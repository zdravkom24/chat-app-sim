import type { FastifyInstance } from 'fastify'
import type { WebSocket } from 'ws'

const clients = new Set<WebSocket>()

export function registerWebSocket(app: FastifyInstance) {
  app.get('/api/ws', { websocket: true }, (socket) => {
    clients.add(socket)
    socket.on('close', () => clients.delete(socket))
  })
}

export function broadcast(event: string, data: unknown) {
  const message = JSON.stringify({ event, data })
  for (const client of clients) {
    if (client.readyState === 1) {
      client.send(message)
    }
  }
}
