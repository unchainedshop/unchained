import { Db } from '@unchainedshop/types/common';
import { Currency } from '@unchainedshop/types/currencies';
import { buildDbIndexes } from 'meteor/unchained:utils'

export const CurrenciesCollection = async (db: Db) => {
  const Currencies = db.collection<Currency>('currencies');

  await buildDbIndexes<Currency>(Currencies, [
    () => Currencies.createIndex({ isoCode: 1 }, { unique: true }),
  ]);

  return Currencies;
};
