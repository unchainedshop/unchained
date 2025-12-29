import { sql, type DrizzleDb } from '@unchainedshop/store';
import { setupEnrollmentsFTS } from './fts.ts';

export {
  enrollments,
  EnrollmentStatus,
  type EnrollmentPeriod,
  type EnrollmentPlan,
  type EnrollmentOrderPositionTemplate,
  type EnrollmentRow,
  type NewEnrollmentRow,
} from './schema.ts';

/**
 * Initialize the enrollments table and indexes in the database.
 * This should be called during database initialization.
 */
export async function initializeEnrollmentsSchema(db: DrizzleDb): Promise<void> {
  // Create the enrollments table
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS enrollments (
      _id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      productId TEXT NOT NULL,
      quantity INTEGER,
      countryCode TEXT NOT NULL,
      currencyCode TEXT NOT NULL,
      enrollmentNumber TEXT,
      status TEXT,
      orderIdForFirstPeriod TEXT,
      expires INTEGER,
      configuration TEXT,
      context TEXT,
      meta TEXT,
      billingAddress TEXT,
      contact TEXT,
      delivery TEXT,
      payment TEXT,
      periods TEXT,
      log TEXT,
      created INTEGER NOT NULL,
      updated INTEGER,
      deleted INTEGER
    )
  `);

  // Create indexes
  await db.run(sql`CREATE INDEX IF NOT EXISTS idx_enrollments_userId ON enrollments(userId)`);
  await db.run(sql`CREATE INDEX IF NOT EXISTS idx_enrollments_productId ON enrollments(productId)`);
  await db.run(sql`CREATE INDEX IF NOT EXISTS idx_enrollments_status ON enrollments(status)`);
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS idx_enrollments_enrollmentNumber ON enrollments(enrollmentNumber)`,
  );

  // Setup FTS5 full-text search
  await setupEnrollmentsFTS(db);
}
