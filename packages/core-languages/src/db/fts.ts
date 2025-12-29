import { createFTS } from '@unchainedshop/store';

const languagesFTS = createFTS({
  ftsTable: 'languages_fts',
  sourceTable: 'languages',
  columns: ['_id', 'isoCode'],
});

export const setupLanguagesFTS = languagesFTS.setup;
export const searchLanguagesFTS = languagesFTS.search;
