import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const cryptopayTransactions = sqliteTable('cryptopay_transactions', {
  _id: text('_id').primaryKey(), // address[:contract] format
  blockHeight: integer('blockHeight').notNull().default(0),
  mostRecentBlockHeight: integer('mostRecentBlockHeight').notNull().default(0),
  amount: text('amount').notNull().default('0'), // Store as text to handle large decimal values
  currencyCode: text('currencyCode').notNull(),
  decimals: integer('decimals'),
  orderPaymentId: text('orderPaymentId'),
  created: integer('created', { mode: 'timestamp' }),
  updated: integer('updated', { mode: 'timestamp' }),
});

export type CryptopayTransaction = typeof cryptopayTransactions.$inferSelect;
export type NewCryptopayTransaction = typeof cryptopayTransactions.$inferInsert;
