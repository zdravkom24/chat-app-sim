import { sqliteTable, text, integer, unique } from 'drizzle-orm/sqlite-core'

// TODO: Z — Supported platforms. Add new platforms here as they are implemented.
export const PLATFORMS = ['whatsapp', 'viber', 'facebook', 'instagram', 'telegram'] as const
export type Platform = (typeof PLATFORMS)[number]

export const contacts = sqliteTable('contacts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  phoneNumber: text('phone_number').notNull(),
  platform: text('platform').notNull().default('whatsapp'),
  avatarUrl: text('avatar_url'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => [
  unique().on(table.phoneNumber, table.platform),
])

export const conversations = sqliteTable('conversations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  contactId: integer('contact_id').notNull().references(() => contacts.id),
  platform: text('platform').notNull().default('whatsapp'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
})

export const messages = sqliteTable('messages', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  conversationId: integer('conversation_id').notNull().references(() => conversations.id),
  wamid: text('wamid').notNull().unique(),
  direction: text('direction', { enum: ['inbound', 'outbound'] }).notNull(),
  type: text('type').notNull(),
  payload: text('payload').notNull(),
  status: text('status', { enum: ['sent', 'delivered', 'read'] }).notNull().default('sent'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
})

export const webhookLogs = sqliteTable('webhook_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  direction: text('direction', { enum: ['outgoing', 'incoming'] }).notNull(),
  url: text('url').notNull(),
  method: text('method').notNull(),
  headers: text('headers').notNull(),
  body: text('body').notNull(),
  responseStatus: integer('response_status'),
  responseBody: text('response_body'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
})

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
})
