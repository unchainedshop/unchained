/**
 * Full-text search for products using SQLite FTS5
 * Multiple FTS tables for different searchable content
 *
 * Note: Manual FTS setup (no triggers) because:
 * - Products: slugs/sku extracted from JSON columns
 * - Product Texts: labels is a JSON column
 * - Product Reviews: simple text columns but kept consistent
 *
 * UNINDEXED columns store IDs for lookup without affecting search.
 */

import { sql, type DrizzleDb } from '@unchainedshop/store';
import { escapeFTS5WithPrefix } from '@unchainedshop/utils';

// Products FTS
export async function setupProductsFTS(db: DrizzleDb): Promise<void> {
  await db.run(
    sql.raw(`
    CREATE VIRTUAL TABLE IF NOT EXISTS products_fts USING fts5(
      _id UNINDEXED,
      sku,
      slugs_text,
      tokenize="unicode61"
    )
  `),
  );
}

export async function searchProductsFTS(db: DrizzleDb, searchText: string): Promise<string[]> {
  // Use secure FTS5 escaping to prevent SQL injection
  const safeQuery = escapeFTS5WithPrefix(searchText);
  if (!safeQuery) return [];

  const result = await db.all<{ _id: string }>(
    sql.raw(`
    SELECT _id FROM products_fts
    WHERE products_fts MATCH '${safeQuery}'
    ORDER BY bm25(products_fts)
  `),
  );
  return result.map((row) => row._id);
}

// Product Texts FTS
export async function setupProductTextsFTS(db: DrizzleDb): Promise<void> {
  await db.run(
    sql.raw(`
    CREATE VIRTUAL TABLE IF NOT EXISTS product_texts_fts USING fts5(
      _id UNINDEXED,
      productId UNINDEXED,
      title,
      subtitle,
      brand,
      vendor,
      description,
      labels,
      slug,
      tokenize="unicode61"
    )
  `),
  );
}

export async function searchProductTextsFTS(db: DrizzleDb, searchText: string): Promise<string[]> {
  // Use secure FTS5 escaping to prevent SQL injection
  const safeQuery = escapeFTS5WithPrefix(searchText);
  if (!safeQuery) return [];

  const result = await db.all<{ productId: string }>(
    sql.raw(`
    SELECT productId FROM product_texts_fts
    WHERE product_texts_fts MATCH '${safeQuery}'
    ORDER BY bm25(product_texts_fts)
  `),
  );
  return result.map((row) => row.productId);
}

// Product Reviews FTS
export async function setupProductReviewsFTS(db: DrizzleDb): Promise<void> {
  await db.run(
    sql.raw(`
    CREATE VIRTUAL TABLE IF NOT EXISTS product_reviews_fts USING fts5(
      _id UNINDEXED,
      productId UNINDEXED,
      title,
      review,
      tokenize="unicode61"
    )
  `),
  );
}

export async function searchProductReviewsFTS(db: DrizzleDb, searchText: string): Promise<string[]> {
  // Use secure FTS5 escaping to prevent SQL injection
  const safeQuery = escapeFTS5WithPrefix(searchText);
  if (!safeQuery) return [];

  const result = await db.all<{ _id: string }>(
    sql.raw(`
    SELECT _id FROM product_reviews_fts
    WHERE product_reviews_fts MATCH '${safeQuery}'
    ORDER BY bm25(product_reviews_fts)
  `),
  );
  return result.map((row) => row._id);
}
