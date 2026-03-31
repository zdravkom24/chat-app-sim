import type { FastifyInstance } from 'fastify'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const UPLOADS_DIR = path.resolve(__dirname, '../../uploads')

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true })
}

export async function mediaRoutes(app: FastifyInstance) {
  // POST /api/media/upload — upload a file, return mediaId
  app.post('/upload', async (request, reply) => {
    const data = await request.file()
    if (!data) {
      return reply.status(400).send({ error: 'No file uploaded' })
    }

    const mediaId = crypto.randomBytes(16).toString('hex')
    const ext = path.extname(data.filename) || '.bin'
    const filename = `${mediaId}${ext}`
    const filePath = path.join(UPLOADS_DIR, filename)

    // Write file to disk
    const buffer = await data.toBuffer()
    fs.writeFileSync(filePath, buffer)

    return {
      mediaId,
      filename: data.filename,
      mimeType: data.mimetype,
      size: buffer.length,
    }
  })

  // GET /api/media/:mediaId/download — serve the file
  app.get<{ Params: { mediaId: string } }>('/:mediaId/download', async (request, reply) => {
    const { mediaId } = request.params

    // Find file by mediaId prefix
    const files = fs.readdirSync(UPLOADS_DIR)
    const match = files.find((f) => f.startsWith(mediaId))

    if (!match) {
      return reply.status(404).send({ error: 'Media not found' })
    }

    const filePath = path.join(UPLOADS_DIR, match)
    const ext = path.extname(match).toLowerCase()
    const mimeMap: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.pdf': 'application/pdf',
    }

    const contentType = mimeMap[ext] || 'application/octet-stream'
    const buffer = fs.readFileSync(filePath)

    return reply
      .header('Content-Type', contentType)
      .header('Content-Length', buffer.length)
      .send(buffer)
  })
}
