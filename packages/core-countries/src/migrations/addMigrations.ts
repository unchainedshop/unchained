import { Migration, MigrationRepository } from '@unchainedshop/types/core.js';
import { CountriesCollection } from '../db/CountriesCollection.js';
import { Country } from '@unchainedshop/types/countries.js';

export default function addMigrations(repository: MigrationRepository<Migration>) {
  repository?.register({
    id: 20240712123500,
    name: 'Convert all tags to lower case to make it easy for search',
    up: async () => {
      const Currencies = await repository.db.collection<{ _id: string; isoCode: string }>('currencies');
      const Countries = await CountriesCollection(repository.db);

      const allCurrencies = await Currencies.find({}).toArray();
      const allCountries = await Countries.find({}).toArray();

      const currencyMap = allCurrencies.reduce(
        (acc, currency) => {
          acc[currency._id] = currency.isoCode;
          return acc;
        },
        {} as Record<string, any>,
      );

      for (const country of allCountries) {
        await Countries.updateOne(
          { _id: country._id, defaultCurrencyId: { $exists: true } },
          {
            $set: {
              defaultCurrencyCode:
                currencyMap[(country as Country & { defaultCurrencyId: string }).defaultCurrencyId],
            },
            $unset: {
              defaultCurrencyId: 1,
            },
          },
        );
      }
    },
  });
}
