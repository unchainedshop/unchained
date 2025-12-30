import { sql, type DrizzleDb } from '@unchainedshop/store';
import { setupAssortmentsFTS, setupAssortmentTextsFTS } from './fts.ts';

export {
  assortments,
  assortmentTexts,
  assortmentProducts,
  assortmentLinks,
  assortmentFilters,
  assortmentProductIdCache,
  assortmentMedia,
  assortmentMediaTexts,
  type Assortment,
  type NewAssortment,
  type AssortmentText,
  type NewAssortmentText,
  type AssortmentProduct,
  type NewAssortmentProduct,
  type AssortmentLink,
  type NewAssortmentLink,
  type AssortmentFilter,
  type NewAssortmentFilter,
  type AssortmentProductIdCacheRecord,
  type NewAssortmentProductIdCacheRecord,
  type AssortmentMediaType,
  type NewAssortmentMedia,
  type AssortmentMediaText,
  type NewAssortmentMediaText,
} from './schema.ts';

export async function initializeAssortmentsSchema(db: DrizzleDb): Promise<void> {
  // Create assortments table
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS assortments (
      _id TEXT PRIMARY KEY,
      isActive INTEGER DEFAULT 0,
      isRoot INTEGER DEFAULT 0,
      sequence INTEGER NOT NULL,
      slugs TEXT DEFAULT '[]',
      tags TEXT DEFAULT '[]',
      meta TEXT,
      created INTEGER NOT NULL,
      updated INTEGER,
      deleted INTEGER
    )
  `);

  await db.run(sql`CREATE INDEX IF NOT EXISTS idx_assortments_deleted ON assortments(deleted)`);
  await db.run(sql`CREATE INDEX IF NOT EXISTS idx_assortments_isActive ON assortments(isActive)`);
  await db.run(sql`CREATE INDEX IF NOT EXISTS idx_assortments_isRoot ON assortments(isRoot)`);
  await db.run(sql`CREATE INDEX IF NOT EXISTS idx_assortments_sequence ON assortments(sequence)`);

  // Create assortment_texts table
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS assortment_texts (
      _id TEXT PRIMARY KEY,
      assortmentId TEXT NOT NULL,
      locale TEXT NOT NULL,
      title TEXT,
      subtitle TEXT,
      description TEXT,
      slug TEXT,
      created INTEGER NOT NULL,
      updated INTEGER
    )
  `);

  await db.run(
    sql`CREATE INDEX IF NOT EXISTS idx_assortment_texts_assortmentId ON assortment_texts(assortmentId)`,
  );
  await db.run(sql`CREATE INDEX IF NOT EXISTS idx_assortment_texts_locale ON assortment_texts(locale)`);
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS idx_assortment_texts_lookup ON assortment_texts(assortmentId, locale)`,
  );
  await db.run(sql`CREATE INDEX IF NOT EXISTS idx_assortment_texts_slug ON assortment_texts(slug)`);

  // Create assortment_products table
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS assortment_products (
      _id TEXT PRIMARY KEY,
      assortmentId TEXT NOT NULL,
      productId TEXT NOT NULL,
      sortKey INTEGER NOT NULL,
      tags TEXT DEFAULT '[]',
      meta TEXT,
      created INTEGER NOT NULL,
      updated INTEGER
    )
  `);

  await db.run(
    sql`CREATE INDEX IF NOT EXISTS idx_assortment_products_assortmentId ON assortment_products(assortmentId)`,
  );
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS idx_assortment_products_productId ON assortment_products(productId)`,
  );
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS idx_assortment_products_sort ON assortment_products(assortmentId, sortKey)`,
  );

  // Create assortment_links table
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS assortment_links (
      _id TEXT PRIMARY KEY,
      parentAssortmentId TEXT NOT NULL,
      childAssortmentId TEXT NOT NULL,
      sortKey INTEGER NOT NULL,
      tags TEXT DEFAULT '[]',
      meta TEXT,
      created INTEGER NOT NULL,
      updated INTEGER
    )
  `);

  await db.run(
    sql`CREATE INDEX IF NOT EXISTS idx_assortment_links_parent ON assortment_links(parentAssortmentId)`,
  );
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS idx_assortment_links_child ON assortment_links(childAssortmentId)`,
  );
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS idx_assortment_links_parent_sort ON assortment_links(parentAssortmentId, sortKey)`,
  );
  await db.run(
    sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_assortment_links_unique ON assortment_links(parentAssortmentId, childAssortmentId)`,
  );

  // Create assortment_filters table
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS assortment_filters (
      _id TEXT PRIMARY KEY,
      assortmentId TEXT NOT NULL,
      filterId TEXT NOT NULL,
      sortKey INTEGER NOT NULL,
      tags TEXT DEFAULT '[]',
      meta TEXT,
      created INTEGER NOT NULL,
      updated INTEGER
    )
  `);

  await db.run(
    sql`CREATE INDEX IF NOT EXISTS idx_assortment_filters_assortmentId ON assortment_filters(assortmentId)`,
  );
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS idx_assortment_filters_filterId ON assortment_filters(filterId)`,
  );
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS idx_assortment_filters_sort ON assortment_filters(assortmentId, sortKey)`,
  );

  // Create assortment_productId_cache table
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS assortment_productId_cache (
      _id TEXT PRIMARY KEY,
      productIds TEXT DEFAULT '[]',
      created INTEGER NOT NULL,
      updated INTEGER
    )
  `);

  // Create assortment_media table
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS assortment_media (
      _id TEXT PRIMARY KEY,
      assortmentId TEXT NOT NULL,
      mediaId TEXT NOT NULL,
      sortKey INTEGER NOT NULL,
      tags TEXT DEFAULT '[]',
      meta TEXT,
      created INTEGER NOT NULL,
      updated INTEGER
    )
  `);

  await db.run(
    sql`CREATE INDEX IF NOT EXISTS idx_assortment_media_mediaId ON assortment_media(mediaId)`,
  );
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS idx_assortment_media_sort ON assortment_media(assortmentId, sortKey)`,
  );
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS idx_assortment_media_assortmentId ON assortment_media(assortmentId)`,
  );

  // Create assortment_media_texts table
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS assortment_media_texts (
      _id TEXT PRIMARY KEY,
      assortmentMediaId TEXT NOT NULL,
      locale TEXT NOT NULL,
      title TEXT,
      subtitle TEXT,
      created INTEGER NOT NULL,
      updated INTEGER
    )
  `);

  await db.run(
    sql`CREATE INDEX IF NOT EXISTS idx_assortment_media_texts_mediaId ON assortment_media_texts(assortmentMediaId)`,
  );
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS idx_assortment_media_texts_locale ON assortment_media_texts(locale)`,
  );

  // Setup FTS
  await setupAssortmentsFTS(db);
  await setupAssortmentTextsFTS(db);
}
