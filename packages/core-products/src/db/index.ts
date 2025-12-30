import { sql, type DrizzleDb } from '@unchainedshop/store';
import { setupProductsFTS, setupProductTextsFTS, setupProductReviewsFTS } from './fts.ts';

// Re-export schema types and tables
export {
  products,
  productTexts,
  productMedia,
  productMediaTexts,
  productVariations,
  productVariationTexts,
  productReviews,
  productRates,
  ProductStatus,
  ProductType,
  ProductContractStandard,
  ProductVariationType,
  ProductReviewVoteType,
  // Domain interfaces
  type Product,
  type ProductText,
  type ProductMedia,
  type ProductMediaText,
  type ProductVariation,
  type ProductVariationText,
  type ProductReview,
  type ProductRate,
  // Row transformation functions
  rowToProduct,
  rowToProductText,
  rowToProductMedia,
  rowToProductMediaText,
  rowToProductVariation,
  rowToProductVariationText,
  rowToProductReview,
  rowToProductRate,
  // Row types
  type ProductRow,
  type NewProductRow,
  type ProductTextRow,
  type NewProductTextRow,
  type ProductMediaRow,
  type NewProductMediaRow,
  type ProductMediaTextRow,
  type NewProductMediaTextRow,
  type ProductVariationRow,
  type NewProductVariationRow,
  type ProductVariationTextRow,
  type NewProductVariationTextRow,
  type ProductReviewRow,
  type NewProductReviewRow,
  type ProductRateRow,
  type NewProductRateRow,
  type ProductStatusType,
  type ProductTypeType,
  type ProductContractStandardType,
  type ProductVariationTypeType,
  type ProductReviewVoteTypeType,
  type ProductAssignment,
  type ProductProxy,
  type ProductSupply,
  type ProductConfiguration,
  type ProductBundleItem,
  type ProductPrice,
  type ProductCommerce,
  type ProductTokenization,
  type ProductPlan,
  type ProductWarehousing,
  type ProductVote,
} from './schema.ts';

export { searchProductsFTS, searchProductTextsFTS, searchProductReviewsFTS } from './fts.ts';

export async function initializeProductsSchema(db: DrizzleDb): Promise<void> {
  // Create products table
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS products (
      _id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      status TEXT,
      sequence INTEGER NOT NULL DEFAULT 0,
      slugs TEXT DEFAULT '[]',
      tags TEXT DEFAULT '[]',
      published INTEGER,
      commerce TEXT,
      bundleItems TEXT,
      proxy TEXT,
      supply TEXT,
      warehousing TEXT,
      plan TEXT,
      tokenization TEXT,
      meta TEXT,
      created INTEGER NOT NULL,
      updated INTEGER,
      deleted INTEGER
    )
  `);

  // Products indexes
  await db.run(sql`CREATE INDEX IF NOT EXISTS idx_products_status ON products(status)`);
  await db.run(sql`CREATE INDEX IF NOT EXISTS idx_products_sequence ON products(sequence)`);
  await db.run(sql`CREATE INDEX IF NOT EXISTS idx_products_deleted ON products(deleted)`);

  // Create product_texts table
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS product_texts (
      _id TEXT PRIMARY KEY,
      productId TEXT NOT NULL,
      locale TEXT NOT NULL,
      slug TEXT,
      title TEXT,
      subtitle TEXT,
      description TEXT,
      brand TEXT,
      vendor TEXT,
      labels TEXT,
      created INTEGER NOT NULL,
      updated INTEGER
    )
  `);

  // Product texts indexes
  await db.run(sql`CREATE INDEX IF NOT EXISTS idx_product_texts_productId ON product_texts(productId)`);
  await db.run(sql`CREATE INDEX IF NOT EXISTS idx_product_texts_locale ON product_texts(locale)`);
  await db.run(sql`CREATE INDEX IF NOT EXISTS idx_product_texts_slug ON product_texts(slug)`);
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS idx_product_texts_lookup ON product_texts(locale, productId)`,
  );

  // Create product_media table
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS product_media (
      _id TEXT PRIMARY KEY,
      mediaId TEXT NOT NULL,
      productId TEXT NOT NULL,
      sortKey INTEGER NOT NULL DEFAULT 0,
      tags TEXT DEFAULT '[]',
      meta TEXT,
      created INTEGER NOT NULL,
      updated INTEGER
    )
  `);

  // Product media indexes
  await db.run(sql`CREATE INDEX IF NOT EXISTS idx_product_media_mediaId ON product_media(mediaId)`);
  await db.run(sql`CREATE INDEX IF NOT EXISTS idx_product_media_productId ON product_media(productId)`);
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS idx_product_media_sortKey ON product_media(productId, sortKey)`,
  );

  // Create product_media_texts table
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS product_media_texts (
      _id TEXT PRIMARY KEY,
      productMediaId TEXT NOT NULL,
      locale TEXT NOT NULL,
      title TEXT,
      subtitle TEXT,
      created INTEGER NOT NULL,
      updated INTEGER
    )
  `);

  // Product media texts indexes
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS idx_product_media_texts_productMediaId ON product_media_texts(productMediaId)`,
  );
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS idx_product_media_texts_locale ON product_media_texts(locale)`,
  );

  // Create product_variations table
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS product_variations (
      _id TEXT PRIMARY KEY,
      productId TEXT NOT NULL,
      key TEXT NOT NULL,
      type TEXT NOT NULL,
      options TEXT DEFAULT '[]',
      tags TEXT,
      created INTEGER NOT NULL,
      updated INTEGER
    )
  `);

  // Product variations indexes
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS idx_product_variations_productId ON product_variations(productId)`,
  );

  // Create product_variation_texts table
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS product_variation_texts (
      _id TEXT PRIMARY KEY,
      productVariationId TEXT NOT NULL,
      productVariationOptionValue TEXT,
      locale TEXT NOT NULL,
      title TEXT,
      subtitle TEXT,
      created INTEGER NOT NULL,
      updated INTEGER
    )
  `);

  // Product variation texts indexes
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS idx_product_variation_texts_variationId ON product_variation_texts(productVariationId)`,
  );
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS idx_product_variation_texts_locale ON product_variation_texts(locale)`,
  );

  // Create product_reviews table
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS product_reviews (
      _id TEXT PRIMARY KEY,
      productId TEXT NOT NULL,
      authorId TEXT NOT NULL,
      rating INTEGER NOT NULL,
      title TEXT,
      review TEXT,
      meta TEXT,
      votes TEXT DEFAULT '[]',
      created INTEGER NOT NULL,
      updated INTEGER,
      deleted INTEGER
    )
  `);

  // Product reviews indexes
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS idx_product_reviews_productId ON product_reviews(productId)`,
  );
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS idx_product_reviews_authorId ON product_reviews(authorId)`,
  );

  // Create product_rates table
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS product_rates (
      _id TEXT PRIMARY KEY,
      baseCurrency TEXT NOT NULL,
      quoteCurrency TEXT NOT NULL,
      rate REAL NOT NULL,
      expiresAt INTEGER,
      timestamp INTEGER
    )
  `);

  // Product rates indexes
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS idx_product_rates_baseCurrency ON product_rates(baseCurrency)`,
  );
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS idx_product_rates_quoteCurrency ON product_rates(quoteCurrency)`,
  );
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS idx_product_rates_expiresAt ON product_rates(expiresAt, timestamp)`,
  );

  // Setup FTS
  await setupProductsFTS(db);
  await setupProductTextsFTS(db);
  await setupProductReviewsFTS(db);
}
