import { sql, type DrizzleDb } from '@unchainedshop/store';

export { workQueue, WorkStatus, type Work, type NewWork } from './schema.ts';

export async function initializeWorkQueueSchema(db: DrizzleDb): Promise<void> {
  // Create table
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS work_queue (
      _id TEXT PRIMARY KEY,
      priority INTEGER NOT NULL DEFAULT 0,
      retries INTEGER NOT NULL DEFAULT 20,
      scheduled INTEGER NOT NULL,
      type TEXT NOT NULL,
      input TEXT,
      error TEXT,
      finished INTEGER,
      originalWorkId TEXT,
      result TEXT,
      started INTEGER,
      success INTEGER,
      timeout INTEGER,
      worker TEXT,
      autoscheduled INTEGER,
      scheduleId TEXT,
      deleted INTEGER,
      created INTEGER NOT NULL,
      updated INTEGER
    )
  `);

  // Create indexes
  await db.run(sql`CREATE INDEX IF NOT EXISTS idx_work_queue_type ON work_queue(type)`);
  await db.run(sql`CREATE INDEX IF NOT EXISTS idx_work_queue_scheduled ON work_queue(scheduled)`);
  await db.run(sql`CREATE INDEX IF NOT EXISTS idx_work_queue_priority ON work_queue(priority)`);
  await db.run(sql`CREATE INDEX IF NOT EXISTS idx_work_queue_created ON work_queue(created)`);
  await db.run(sql`CREATE INDEX IF NOT EXISTS idx_work_queue_started ON work_queue(started)`);
  await db.run(sql`CREATE INDEX IF NOT EXISTS idx_work_queue_finished ON work_queue(finished)`);
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS idx_work_queue_originalWorkId ON work_queue(originalWorkId)`,
  );
  await db.run(sql`CREATE INDEX IF NOT EXISTS idx_work_queue_deleted ON work_queue(deleted)`);
}
