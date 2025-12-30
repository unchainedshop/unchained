import { createFTS } from '@unchainedshop/store';

// FTS for users - search across username and _id
// Email and profile search is done via JSON extraction in queries
const usersFTS = createFTS({
  ftsTable: 'users_fts',
  sourceTable: 'users',
  columns: ['_id', 'username'],
});

export const setupUsersFTS = usersFTS.setup;
export const searchUsersFTS = usersFTS.search;
