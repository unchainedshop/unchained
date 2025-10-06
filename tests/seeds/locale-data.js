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
