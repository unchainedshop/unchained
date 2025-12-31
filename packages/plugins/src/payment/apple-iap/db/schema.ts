import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const appleTransactions = sqliteTable('payment_apple_iap_processed_transactions', {
  _id: text('_id').primaryKey(),
  matchedTransaction: text('matchedTransaction', { mode: 'json' }),
  orderId: text('orderId').notNull(),
  created: integer('created', { mode: 'timestamp' }),
  updated: integer('updated', { mode: 'timestamp' }),
});

export type AppleTransaction = typeof appleTransactions.$inferSelect;
export type NewAppleTransaction = typeof appleTransactions.$inferInsert;
