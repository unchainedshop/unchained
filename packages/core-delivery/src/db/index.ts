import { sql, type DrizzleDb } from '@unchainedshop/store';

export {
  deliveryProviders,
  DeliveryProviderType,
  type DeliveryProviderRow,
  type NewDeliveryProviderRow,
} from './schema.ts';

/**
 * Initialize the delivery providers table and indexes in the database.
 * This should be called during database initialization.
 */
export async function initializeDeliverySchema(db: DrizzleDb): Promise<void> {
  // Create the delivery_providers table
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS delivery_providers (
      _id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      adapterKey TEXT NOT NULL,
      configuration TEXT,
      created INTEGER NOT NULL,
      updated INTEGER,
      deleted INTEGER
    )
  `);

  // Create indexes
  await db.run(sql`CREATE INDEX IF NOT EXISTS idx_delivery_providers_type ON delivery_providers(type)`);
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS idx_delivery_providers_created ON delivery_providers(created)`,
  );
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS idx_delivery_providers_deleted ON delivery_providers(deleted)`,
  );
}
