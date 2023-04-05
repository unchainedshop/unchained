import { Db } from '@unchainedshop/types/common.js';
import { Currency } from '@unchainedshop/types/currencies.js';
import { buildDbIndexes } from '@unchainedshop/mongodb';

export const CurrenciesCollection = async (db: Db) => {
  const Currencies = db.collection<Currency>('currencies');

  await buildDbIndexes<Currency>(Currencies, [
    { index: { isoCode: 1 }, options: { unique: true } },
    {
      index: { isoCode: 'text', _id: 'text' },
      options: {
        weights: {
          _id: 8,
          isoCode: 6,
        },
        name: 'currencies_fulltext_search',
      },
    },
  ]);

  return Currencies;
};
