import { createFTS } from '@unchainedshop/store';

const eventsFTS = createFTS({
  ftsTable: 'events_fts',
  sourceTable: 'events',
  columns: ['_id', 'type'],
});

export const setupEventsFTS = eventsFTS.setup;
export const searchEventsFTS = eventsFTS.search;
