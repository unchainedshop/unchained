import type { MigrationRepository } from '@unchainedshop/mongodb';
import { CountriesCollection } from '../db/CountriesCollection.ts';
import type { Country } from '../countries-index.ts';

export default function convertDefaultCurrencyCode(repository: MigrationRepository) {
  repository?.register({
    id: 20241220123500,
    name: 'Remove defaultCurrencyId from countries and add defaultCurrencyCode',
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
        {} as Record<string, string>,
      );

      for (const country of allCountries) {
        await Countries.updateOne({ _id: country._id, defaultCurrencyId: { $exists: true } } as any, {
          $set: {
            defaultCurrencyCode:
              currencyMap[(country as Country & { defaultCurrencyId: string }).defaultCurrencyId],
          },
          $unset: {
            defaultCurrencyId: 1,
          },
        });
      }
    },
  });
}
