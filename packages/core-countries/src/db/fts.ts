import { createFTS } from '@unchainedshop/store';

const countriesFTS = createFTS({
  ftsTable: 'countries_fts',
  sourceTable: 'countries',
  columns: ['_id', 'isoCode', 'defaultCurrencyCode'],
});

export const setupCountriesFTS = countriesFTS.setup;
export const searchCountriesFTS = countriesFTS.search;
