import { mongodb, buildDbIndexes, isDocumentDBCompatModeEnabled } from '@unchainedshop/mongodb';
import type { Country } from '../countries-index.ts';

export const CountriesCollection = async (db: mongodb.Db) => {
  const Countries = db.collection<Country>('countries');

  if (!isDocumentDBCompatModeEnabled()) {
    await buildDbIndexes<Country>(Countries, [
      {
        index: { isoCode: 'text', _id: 'text' },
        options: {
          weights: {
            _id: 8,
            isoCode: 6,
          },
          name: 'countries_fulltext_search',
        },
      },
    ]);
  }

  await buildDbIndexes<Country>(Countries, [
    { index: { isoCode: 1 }, options: { unique: true } },
    {
      index: {
        deleted: 1,
      },
    },
  ]);

  return Countries;
};
