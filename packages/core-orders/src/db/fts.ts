/**
 * Full-text search for orders using SQLite FTS5
 *
 * Orders FTS indexes:
 * - _id, userId, orderNumber, status for lookups
 * - contact.emailAddress, contact.telNumber extracted from JSON
 *
 * Note: Manual FTS setup (no triggers) because contact fields are in JSON column
 * and need to be extracted with json_extract.
 */

import { sql, type DrizzleDb } from '@unchainedshop/store';

// Helper to build FTS5 match query from search text
function buildMatchQuery(searchText: string): string | null {
  const escapedSearch = searchText.replace(/[*"\\]/g, '');
  if (!escapedSearch.trim()) return null;

  const tokens = escapedSearch.split(/[-_\s]+/).filter((t) => t.length > 0);
  if (tokens.length === 0) return null;

  return tokens.map((token) => `${token}*`).join(' OR ');
}

// Orders FTS - includes contact fields extracted from JSON
export async function setupOrdersFTS(db: DrizzleDb): Promise<void> {
  await db.run(
    sql.raw(`
    CREATE VIRTUAL TABLE IF NOT EXISTS orders_fts USING fts5(
      _id UNINDEXED,
      userId,
      orderNumber,
      status,
      emailAddress,
      telNumber,
      tokenize="unicode61"
    )
  `),
  );
}

export async function searchOrdersFTS(db: DrizzleDb, searchText: string): Promise<string[]> {
  const matchQuery = buildMatchQuery(searchText);
  if (!matchQuery) return [];

  const result = await db.all<{ _id: string }>(
    sql.raw(`
    SELECT _id FROM orders_fts
    WHERE orders_fts MATCH '${matchQuery}'
    ORDER BY bm25(orders_fts)
  `),
  );
  return result.map((row) => row._id);
}

/**
 * Insert or update an order in the FTS index.
 * Must be called after inserting/updating an order.
 */
export async function upsertOrderFTS(
  db: DrizzleDb,
  order: {
    _id: string;
    userId: string;
    orderNumber?: string | null;
    status?: string | null;
    contact?: { emailAddress?: string; telNumber?: string } | null;
  },
): Promise<void> {
  // Delete existing entry
  await db.run(sql`DELETE FROM orders_fts WHERE _id = ${order._id}`);

  // Insert new entry
  await db.run(sql`
    INSERT INTO orders_fts (_id, userId, orderNumber, status, emailAddress, telNumber)
    VALUES (
      ${order._id},
      ${order.userId},
      ${order.orderNumber || ''},
      ${order.status || ''},
      ${order.contact?.emailAddress || ''},
      ${order.contact?.telNumber || ''}
    )
  `);
}

/**
 * Delete an order from the FTS index.
 */
export async function deleteOrderFTS(db: DrizzleDb, orderId: string): Promise<void> {
  await db.run(sql`DELETE FROM orders_fts WHERE _id = ${orderId}`);
}
