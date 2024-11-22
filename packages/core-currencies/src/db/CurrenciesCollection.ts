import { mongodb, buildDbIndexes, TimestampFields } from '@unchainedshop/mongodb';

export type Currency = {
  _id?: string;
  isoCode: string;
  isActive: boolean;
  contractAddress?: string;
  decimals?: number;
} & TimestampFields;

export type CurrencyQuery = {
  includeInactive?: boolean;
  contractAddress?: string;
  queryString?: string;
};

export const CurrenciesCollection = async (db: mongodb.Db) => {
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
    {
      index: {
        deleted: 1,
      },
    },
  ]);

  return Currencies;
};
