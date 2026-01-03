import { sql, type DrizzleDb } from '@unchainedshop/store';

export {
  filters,
  filterTexts,
  filterProductIdCache,
  FilterType,
  type Filter,
  type NewFilter,
  type FilterText,
  type NewFilterText,
  type FilterProductIdCacheRecord,
  type NewFilterProductIdCacheRecord,
} from './schema.ts';

export async function initializeFiltersSchema(db: DrizzleDb): Promise<void> {
  // Create filters table
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS filters (
      _id TEXT PRIMARY KEY,
      key TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL,
      isActive INTEGER,
      options TEXT DEFAULT '[]',
      meta TEXT,
      created INTEGER NOT NULL,
      updated INTEGER
    )
  `);

  // Create indexes
  await db.run(sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_filters_key ON filters(key)`);
  await db.run(sql`CREATE INDEX IF NOT EXISTS idx_filters_isActive ON filters(isActive)`);

  // Create filter_texts table
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS filter_texts (
      _id TEXT PRIMARY KEY,
      filterId TEXT NOT NULL,
      filterOptionValue TEXT,
      locale TEXT NOT NULL,
      title TEXT,
      subtitle TEXT,
      created INTEGER NOT NULL,
      updated INTEGER
    )
  `);

  // Create indexes for filter_texts
  await db.run(sql`CREATE INDEX IF NOT EXISTS idx_filter_texts_filterId ON filter_texts(filterId)`);
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS idx_filter_texts_filterOptionValue ON filter_texts(filterOptionValue)`,
  );
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS idx_filter_texts_lookup ON filter_texts(filterId, filterOptionValue, locale)`,
  );

  // Create filter_productId_cache table
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS filter_productId_cache (
      _id TEXT PRIMARY KEY,
      filterId TEXT NOT NULL,
      filterOptionValue TEXT,
      productIds TEXT,
      hash TEXT
    )
  `);

  // Create indexes for filter_productId_cache
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS idx_filter_cache_filterId ON filter_productId_cache(filterId)`,
  );
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS idx_filter_cache_lookup ON filter_productId_cache(filterId, filterOptionValue)`,
  );
}
