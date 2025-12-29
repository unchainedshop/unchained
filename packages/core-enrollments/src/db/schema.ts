import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

export interface EnrollmentPeriod {
  start: Date;
  end: Date;
  orderId?: string;
  isTrial?: boolean;
}

export interface EnrollmentPlan {
  configuration: { key: string; value: string }[] | null;
  productId: string;
  quantity: number;
}

export const EnrollmentStatus = {
  INITIAL: 'INITIAL',
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  TERMINATED: 'TERMINATED',
} as const;

export type EnrollmentStatus = (typeof EnrollmentStatus)[keyof typeof EnrollmentStatus];

export interface EnrollmentOrderPositionTemplate {
  context?: any;
  configuration?: { key: string; value: string }[];
  originalProductId: string;
  productId: string;
  quantity: number;
  quotationId?: string;
}

/**
 * Enrollments table schema for SQLite/Turso.
 */
export const enrollments = sqliteTable(
  'enrollments',
  {
    _id: text('_id').primaryKey(),
    userId: text('userId').notNull(),
    productId: text('productId').notNull(),
    quantity: integer('quantity'),
    countryCode: text('countryCode').notNull(),
    currencyCode: text('currencyCode').notNull(),
    enrollmentNumber: text('enrollmentNumber'),
    status: text('status'),
    orderIdForFirstPeriod: text('orderIdForFirstPeriod'),
    expires: integer('expires', { mode: 'timestamp_ms' }),
    configuration: text('configuration'), // JSON string
    context: text('context'), // JSON string
    meta: text('meta'), // JSON string
    billingAddress: text('billingAddress'), // JSON string
    contact: text('contact'), // JSON string
    delivery: text('delivery'), // JSON string
    payment: text('payment'), // JSON string
    periods: text('periods'), // JSON string array
    log: text('log'), // JSON string array
    created: integer('created', { mode: 'timestamp_ms' }).notNull(),
    updated: integer('updated', { mode: 'timestamp_ms' }),
    deleted: integer('deleted', { mode: 'timestamp_ms' }),
  },
  (table) => [
    index('idx_enrollments_userId').on(table.userId),
    index('idx_enrollments_productId').on(table.productId),
    index('idx_enrollments_status').on(table.status),
    index('idx_enrollments_enrollmentNumber').on(table.enrollmentNumber),
  ],
);

export type EnrollmentRow = typeof enrollments.$inferSelect;
export type NewEnrollmentRow = typeof enrollments.$inferInsert;
