import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

export const DeliveryProviderType = {
  SHIPPING: 'SHIPPING',
  PICKUP: 'PICKUP',
} as const;

export type DeliveryProviderType = (typeof DeliveryProviderType)[keyof typeof DeliveryProviderType];

/**
 * Delivery providers table schema for SQLite/Turso.
 */
export const deliveryProviders = sqliteTable(
  'delivery_providers',
  {
    _id: text('_id').primaryKey(),
    type: text('type').notNull(),
    adapterKey: text('adapterKey').notNull(),
    configuration: text('configuration', { mode: 'json' }).$type<
      { key: string; value: string }[] | null
    >(),
    created: integer('created', { mode: 'timestamp_ms' }).notNull(),
    updated: integer('updated', { mode: 'timestamp_ms' }),
    deleted: integer('deleted', { mode: 'timestamp_ms' }),
  },
  (table) => [
    index('idx_delivery_providers_type').on(table.type),
    index('idx_delivery_providers_created').on(table.created),
    index('idx_delivery_providers_deleted').on(table.deleted),
  ],
);

export type DeliveryProviderRow = typeof deliveryProviders.$inferSelect;
export type NewDeliveryProviderRow = typeof deliveryProviders.$inferInsert;
