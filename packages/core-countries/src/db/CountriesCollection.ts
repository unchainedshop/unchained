import { mongodb, buildDbIndexes } from '@unchainedshop/mongodb';
import { Country } from '../countries-index.js';

export const CountriesCollection = async (db: mongodb.Db) => {
  const Countries = db.collection<Country>('countries');

  await buildDbIndexes<Country>(Countries, [
    { index: { isoCode: 1 }, options: { unique: true } },
    {
      index: {
        deleted: 1,
      },
    },
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

  return Countries;
};
