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
    configuration: text('configuration', { mode: 'json' }).$type<
      { key: string; value: string }[] | null
    >(),
    context: text('context', { mode: 'json' }).$type<Record<string, unknown> | null>(),
    meta: text('meta', { mode: 'json' }).$type<Record<string, unknown> | null>(),
    billingAddress: text('billingAddress', { mode: 'json' }).$type<Record<string, unknown> | null>(),
    contact: text('contact', { mode: 'json' }).$type<Record<string, unknown> | null>(),
    delivery: text('delivery', { mode: 'json' }).$type<{
      deliveryProviderId?: string;
      context?: Record<string, unknown>;
    } | null>(),
    payment: text('payment', { mode: 'json' }).$type<{
      paymentProviderId?: string;
      context?: Record<string, unknown>;
    } | null>(),
    periods: text('periods', { mode: 'json' }).$type<EnrollmentPeriod[] | null>(),
    log: text('log', { mode: 'json' }).$type<{ date: string; status: string; info: string }[] | null>(),
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
