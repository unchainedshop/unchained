import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const saferpayTransactions = sqliteTable('payment_saferpay_transactions', {
  _id: text('_id').primaryKey(),
  orderPaymentId: text('orderPaymentId').notNull(),
  token: text('token'),
  created: integer('created', { mode: 'timestamp' }),
  updated: integer('updated', { mode: 'timestamp' }),
});

export type SaferpayTransaction = typeof saferpayTransactions.$inferSelect;
export type NewSaferpayTransaction = typeof saferpayTransactions.$inferInsert;
