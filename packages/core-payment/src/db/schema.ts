import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

export const PaymentProviderType = {
  INVOICE: 'INVOICE',
  GENERIC: 'GENERIC',
} as const;

export type PaymentProviderType = (typeof PaymentProviderType)[keyof typeof PaymentProviderType];

/**
 * Payment providers table schema for SQLite/Turso.
 */
export const paymentProviders = sqliteTable(
  'payment_providers',
  {
    _id: text('_id').primaryKey(),
    type: text('type').notNull(),
    adapterKey: text('adapterKey').notNull(),
    configuration: text('configuration'), // JSON string
    created: integer('created', { mode: 'timestamp_ms' }).notNull(),
    updated: integer('updated', { mode: 'timestamp_ms' }),
    deleted: integer('deleted', { mode: 'timestamp_ms' }),
  },
  (table) => [
    index('idx_payment_providers_type').on(table.type),
    index('idx_payment_providers_created').on(table.created),
    index('idx_payment_providers_deleted').on(table.deleted),
  ],
);

export type PaymentProviderRow = typeof paymentProviders.$inferSelect;
export type NewPaymentProviderRow = typeof paymentProviders.$inferInsert;

/**
 * Payment credentials table schema for SQLite/Turso.
 */
export const paymentCredentials = sqliteTable(
  'payment_credentials',
  {
    _id: text('_id').primaryKey(),
    paymentProviderId: text('paymentProviderId').notNull(),
    userId: text('userId').notNull(),
    token: text('token'),
    isPreferred: integer('isPreferred', { mode: 'boolean' }),
    meta: text('meta'), // JSON string
    created: integer('created', { mode: 'timestamp_ms' }).notNull(),
    updated: integer('updated', { mode: 'timestamp_ms' }),
  },
  (table) => [
    index('idx_payment_credentials_paymentProviderId').on(table.paymentProviderId),
    index('idx_payment_credentials_userId').on(table.userId),
  ],
);

export type PaymentCredentialsRow = typeof paymentCredentials.$inferSelect;
export type NewPaymentCredentialsRow = typeof paymentCredentials.$inferInsert;
