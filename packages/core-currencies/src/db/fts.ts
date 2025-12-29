import { createFTS } from '@unchainedshop/store';

const currenciesFTS = createFTS({
  ftsTable: 'currencies_fts',
  sourceTable: 'currencies',
  columns: ['_id', 'isoCode', 'contractAddress'],
});

export const setupCurrenciesFTS = currenciesFTS.setup;
export const searchCurrenciesFTS = currenciesFTS.search;
