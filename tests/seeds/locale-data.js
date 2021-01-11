import chainedUpsert from './utils/chainedUpsert';

const BaseCountry = {
  _id: 'ch',
  isoCode: 'CH',
  isActive: true,
  defaultCurrencyId: 'chf',
};

const BaseLanguage = {
  _id: 'de',
  isoCode: 'de',
  isActive: true,
};

const BaseCurrency = {
  _id: 'chf',
  isoCode: 'CHF',
  isActive: true,
};

export default async function seedOrders(db) {
  return chainedUpsert(db)
    .upsert('countries', BaseCountry)
    .upsert('languages', BaseLanguage)
    .upsert('currencies', BaseCurrency)
    .resolve();
}
