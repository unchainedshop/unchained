import { createFTS } from '@unchainedshop/store';

/**
 * FTS5 full-text search for token surrogates.
 * Indexes: tokenSerialNumber, userId, productId, _id, walletAddress, contractAddress
 */
const tokenSurrogatesFTS = createFTS({
  ftsTable: 'token_surrogates_fts',
  sourceTable: 'token_surrogates',
  columns: ['_id', 'tokenSerialNumber', 'userId', 'productId', 'contractAddress', 'walletAddress'],
});

export const setupTokenSurrogatesFTS = tokenSurrogatesFTS.setup;
export const searchTokenSurrogatesFTS = tokenSurrogatesFTS.search;
