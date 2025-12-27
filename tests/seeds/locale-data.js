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

// All countries for seeding
const allCountries = [BaseCountry, GermanyCountry, FranceCountry, InactiveCountry];

// All languages for seeding
const allLanguages = [BaseLanguage, ItalianLanguage, InactiveLanguage, EnglishLanguage];

// All currencies for seeding
const allCurrencies = [BaseCurrency, EuroCurrency, UsdCurrency, InactiveCurrency];

/**
 * Seed locale data (countries, languages, currencies) into the store.
 */
export async function seedLocaleDataToStore(store) {
  const Countries = store.table('countries');
  const Languages = store.table('languages');
  const Currencies = store.table('currencies');

  // Clear existing data
  await Countries.deleteMany({});
  await Languages.deleteMany({});
  await Currencies.deleteMany({});

  // Insert all countries
  for (const country of allCountries) {
    await Countries.insertOne({
      ...country,
      created: new Date(),
      deleted: null,
    });
  }

  // Insert all languages
  for (const language of allLanguages) {
    await Languages.insertOne({
      ...language,
      created: new Date(),
      deleted: null,
    });
  }

  // Insert all currencies
  for (const currency of allCurrencies) {
    await Currencies.insertOne({
      ...currency,
      created: new Date(),
      deleted: null,
    });
  }
}
