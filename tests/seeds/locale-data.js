import chainedUpsert from './utils/chainedUpsert.js';

export const BaseCountry = {
  _id: 'ch',
  isoCode: 'CH',
  isActive: true,
  defaultCurrencyCode: 'CHF',
};

export const GermanyCountry = {
  _id: 'de',
  isoCode: 'DE',
  isActive: true,
  defaultCurrencyCode: 'EUR',
};

export const FranceCountry = {
  _id: 'fr',
  isoCode: 'FR',
  isActive: true,
  defaultCurrencyCode: 'EUR',
};

export const InactiveCountry = {
  _id: 'us',
  isoCode: 'US',
  isActive: false,
  defaultCurrencyCode: 'USD',
};

// All countries for seeding
const allCountries = [BaseCountry, GermanyCountry, FranceCountry, InactiveCountry];

export const BaseLanguage = {
  _id: 'de',
  isoCode: 'de',
  isActive: true,
};

export const InactiveLanguage = {
  _id: 'fr',
  isoCode: 'fr',
  isActive: false,
};

export const ItalianLanguage = {
  _id: 'it',
  isoCode: 'it',
  isActive: true,
};

export const EnglishLanguage = {
  _id: 'en',
  isoCode: 'en',
  isActive: true,
};

export const BaseCurrency = {
  _id: 'chf',
  isoCode: 'CHF',
  isActive: true,
};

export const EuroCurrency = {
  _id: 'eur',
  isoCode: 'EUR',
  isActive: true,
};

export const UsdCurrency = {
  _id: 'usd',
  isoCode: 'USD',
  isActive: true,
};

export const InactiveCurrency = {
  _id: 'gbp',
  isoCode: 'GBP',
  isActive: false,
};

export default async function seedOrders(db) {
  return chainedUpsert(db)
    .upsert('countries', BaseCountry)
    .upsert('countries', GermanyCountry)
    .upsert('countries', FranceCountry)
    .upsert('countries', InactiveCountry)
    .upsert('languages', BaseLanguage)
    .upsert('languages', ItalianLanguage)
    .upsert('languages', InactiveLanguage)
    .upsert('languages', EnglishLanguage)
    .upsert('currencies', BaseCurrency)
    .upsert('currencies', EuroCurrency)
    .upsert('currencies', UsdCurrency)
    .upsert('currencies', InactiveCurrency)
    .resolve();
}

/**
 * Seed countries into the Drizzle database.
 * This directly inserts into the database WITHOUT using the module to avoid emitting events.
 * This is needed because the countries module now uses Drizzle ORM instead of MongoDB.
 */
export async function seedCountriesToDrizzle(db) {
  const { countries } = await import('@unchainedshop/core-countries');
  const { sql } = await import('drizzle-orm');

  // Delete all existing countries directly
  await db.delete(countries);

  // Insert all countries directly (bypassing module to avoid emitting events)
  for (const country of allCountries) {
    await db.insert(countries).values({
      _id: country._id,
      isoCode: country.isoCode,
      isActive: country.isActive,
      defaultCurrencyCode: country.defaultCurrencyCode,
      created: new Date(),
      deleted: null,
    });
  }

  // Also update the FTS index directly
  await db.run(sql`DELETE FROM countries_fts`);
  for (const country of allCountries) {
    await db.run(
      sql`INSERT INTO countries_fts (_id, isoCode, defaultCurrencyCode) VALUES (${country._id}, ${country.isoCode}, ${country.defaultCurrencyCode})`,
    );
  }
}
