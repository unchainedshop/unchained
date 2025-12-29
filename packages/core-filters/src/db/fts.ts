import { createFTS } from '@unchainedshop/store';

const filtersFTS = createFTS({
  ftsTable: 'filters_fts',
  sourceTable: 'filters',
  columns: ['_id', 'key', 'options'],
});

export const setupFiltersFTS = filtersFTS.setup;
export const searchFiltersFTS = filtersFTS.search;
