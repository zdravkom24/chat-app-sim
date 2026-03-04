import { sql } from 'drizzle-orm'
import { db } from './index.js'
import { contacts, conversations, messages, webhookLogs, settings } from './schema.js'

export function runMigrations() {
  db.run(sql`CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    platform TEXT NOT NULL DEFAULT 'whatsapp',
    avatar_url TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(phone_number, platform)
  )`)

  db.run(sql`CREATE TABLE IF NOT EXISTS conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    contact_id INTEGER NOT NULL REFERENCES contacts(id),
    platform TEXT NOT NULL DEFAULT 'whatsapp',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`)

  db.run(sql`CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id INTEGER NOT NULL REFERENCES conversations(id),
    wamid TEXT NOT NULL UNIQUE,
    direction TEXT NOT NULL,
    type TEXT NOT NULL,
    payload TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'sent',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`)

  db.run(sql`CREATE TABLE IF NOT EXISTS webhook_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    direction TEXT NOT NULL,
    url TEXT NOT NULL,
    method TEXT NOT NULL,
    headers TEXT NOT NULL,
    body TEXT NOT NULL,
    response_status INTEGER,
    response_body TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`)

  db.run(sql`CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  )`)

  try {
    db.run(sql`ALTER TABLE contacts ADD COLUMN platform TEXT NOT NULL DEFAULT 'whatsapp'`)
  } catch { /* column already exists */ }
  try {
    db.run(sql`ALTER TABLE conversations ADD COLUMN platform TEXT NOT NULL DEFAULT 'whatsapp'`)
  } catch { /* column already exists */ }

  const existing = db.select().from(settings).all()
  if (existing.length === 0) {
    db.insert(settings).values([
      { key: 'webhook_url', value: 'http://host.docker.internal:4091/api/webhook' },
      { key: 'verify_token', value: 'partificialai2025' },
      { key: 'phone_number_id', value: '000000000000000' },
      { key: 'business_account_id', value: '000000000000000' },
      { key: 'display_phone_number', value: '15550000000' },
      { key: 'auto_status_webhooks', value: 'true' },
    ]).run()
  }
}
