import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

export const WorkStatus = {
  NEW: 'NEW',
  ALLOCATED: 'ALLOCATED',
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
  DELETED: 'DELETED',
} as const;

export type WorkStatus = (typeof WorkStatus)[keyof typeof WorkStatus];

export const workQueue = sqliteTable(
  'work_queue',
  {
    _id: text('_id').primaryKey(),
    priority: integer('priority').notNull().default(0),
    retries: integer('retries').notNull().default(20),
    scheduled: integer('scheduled', { mode: 'timestamp_ms' }).notNull(),
    type: text('type').notNull(),
    input: text('input', { mode: 'json' }).$type<Record<string, unknown>>(),
    error: text('error', { mode: 'json' }).$type<Record<string, unknown>>(),
    finished: integer('finished', { mode: 'timestamp_ms' }),
    originalWorkId: text('originalWorkId'),
    result: text('result', { mode: 'json' }),
    started: integer('started', { mode: 'timestamp_ms' }),
    success: integer('success', { mode: 'boolean' }),
    timeout: integer('timeout'),
    worker: text('worker'),
    autoscheduled: integer('autoscheduled', { mode: 'boolean' }),
    scheduleId: text('scheduleId'),
    deleted: integer('deleted', { mode: 'timestamp_ms' }),
    created: integer('created', { mode: 'timestamp_ms' }).notNull(),
    updated: integer('updated', { mode: 'timestamp_ms' }),
  },
  (table) => [
    index('idx_work_queue_type').on(table.type),
    index('idx_work_queue_scheduled').on(table.scheduled),
    index('idx_work_queue_priority').on(table.priority),
    index('idx_work_queue_created').on(table.created),
    index('idx_work_queue_started').on(table.started),
    index('idx_work_queue_finished').on(table.finished),
    index('idx_work_queue_originalWorkId').on(table.originalWorkId),
    index('idx_work_queue_deleted').on(table.deleted),
  ],
);

export type Work = typeof workQueue.$inferSelect;
export type NewWork = typeof workQueue.$inferInsert;
