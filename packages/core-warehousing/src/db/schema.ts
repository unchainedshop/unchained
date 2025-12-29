import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

export const WarehousingProviderType = {
  PHYSICAL: 'PHYSICAL',
  VIRTUAL: 'VIRTUAL',
} as const;

export type WarehousingProviderType =
  (typeof WarehousingProviderType)[keyof typeof WarehousingProviderType];

/**
 * Warehousing providers table schema for SQLite/Turso.
 */
export const warehousingProviders = sqliteTable(
  'warehousing_providers',
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
    index('idx_warehousing_providers_type').on(table.type),
    index('idx_warehousing_providers_created').on(table.created),
    index('idx_warehousing_providers_deleted').on(table.deleted),
  ],
);

export type WarehousingProviderRow = typeof warehousingProviders.$inferSelect;
export type NewWarehousingProviderRow = typeof warehousingProviders.$inferInsert;

export const TokenStatus = {
  CENTRALIZED: 'CENTRALIZED',
  EXPORTING: 'EXPORTING',
  DECENTRALIZED: 'DECENTRALIZED',
} as const;

export type TokenStatus = (typeof TokenStatus)[keyof typeof TokenStatus];

/**
 * Token surrogates table schema for SQLite/Turso.
 */
export const tokenSurrogates = sqliteTable(
  'token_surrogates',
  {
    _id: text('_id').primaryKey(),
    userId: text('userId'),
    walletAddress: text('walletAddress'),
    invalidatedDate: integer('invalidatedDate', { mode: 'timestamp_ms' }),
    expiryDate: integer('expiryDate', { mode: 'timestamp_ms' }),
    quantity: integer('quantity').notNull(),
    contractAddress: text('contractAddress'),
    chainId: text('chainId'),
    tokenSerialNumber: text('tokenSerialNumber').notNull(),
    productId: text('productId').notNull(),
    orderPositionId: text('orderPositionId').notNull(),
    meta: text('meta'), // JSON string
  },
  (table) => [
    index('idx_token_surrogates_userId').on(table.userId),
    index('idx_token_surrogates_productId').on(table.productId),
    index('idx_token_surrogates_orderPositionId').on(table.orderPositionId),
    index('idx_token_surrogates_tokenSerialNumber').on(table.tokenSerialNumber),
  ],
);

export type TokenSurrogateRow = typeof tokenSurrogates.$inferSelect;
export type NewTokenSurrogateRow = typeof tokenSurrogates.$inferInsert;
