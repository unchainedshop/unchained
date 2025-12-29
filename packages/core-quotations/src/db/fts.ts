import { createFTS } from '@unchainedshop/store';

/**
 * FTS5 full-text search for quotations.
 * Indexes: _id, userId, quotationNumber, status
 */
const quotationsFTS = createFTS({
  ftsTable: 'quotations_fts',
  sourceTable: 'quotations',
  columns: ['_id', 'userId', 'quotationNumber', 'status'],
});

export const setupQuotationsFTS = quotationsFTS.setup;
export const searchQuotationsFTS = quotationsFTS.search;
