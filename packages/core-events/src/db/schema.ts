import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

export const events = sqliteTable(
  'events',
  {
    _id: text('_id').primaryKey(),
    type: text('type').notNull(),
    context: text('context', { mode: 'json' }).$type<Record<string, unknown>>(),
    payload: text('payload', { mode: 'json' }).$type<Record<string, unknown>>(),
    created: integer('created', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [index('idx_events_type').on(table.type), index('idx_events_created').on(table.created)],
);

export type EventRow = typeof events.$inferSelect;
export type NewEventRow = typeof events.$inferInsert;
