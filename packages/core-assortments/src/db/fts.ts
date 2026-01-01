import { sql, createFTS, type DrizzleDb } from '@unchainedshop/store';
import { escapeFTS5WithPrefix } from '@unchainedshop/utils';

/**
 * Assortments FTS - manual setup because slugs is a JSON array that needs preprocessing.
 * The _id column is included for searching by assortment ID.
 */
export async function setupAssortmentsFTS(db: DrizzleDb): Promise<void> {
  await db.run(
    sql.raw(`
    CREATE VIRTUAL TABLE IF NOT EXISTS assortments_fts USING fts5(
      _id,
      slugs_text,
      tokenize="unicode61"
    )
  `),
  );
}

export async function searchAssortmentsFTS(db: DrizzleDb, searchText: string): Promise<string[]> {
  // Use secure FTS5 escaping to prevent SQL injection
  const safeQuery = escapeFTS5WithPrefix(searchText);
  if (!safeQuery) return [];

  const result = await db.all<{ _id: string }>(
    sql.raw(`
    SELECT _id FROM assortments_fts
    WHERE assortments_fts MATCH '${safeQuery}'
    ORDER BY bm25(assortments_fts)
  `),
  );
  return result.map((row) => row._id);
}

/**
 * Assortment Texts FTS - uses createFTS for simple text columns.
 */
const assortmentTextsFTS = createFTS({
  ftsTable: 'assortment_texts_fts',
  sourceTable: 'assortment_texts',
  columns: ['_id', 'assortmentId', 'title', 'subtitle'],
});

export const setupAssortmentTextsFTS = assortmentTextsFTS.setup;
export const searchAssortmentTextsFTS = assortmentTextsFTS.search;
