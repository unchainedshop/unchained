const { setupDatabase, createAdminApolloFetch } = require('./helpers');
const { Admin } = require('./seeds/users');

let connection;
let db;
let apolloFetch;

describe('shop configuration', () => {
  beforeAll(async () => {
    [db, connection] = await setupDatabase();
    apolloFetch = await createAdminApolloFetch();
  });

  afterAll(async () => {
    await connection.close();
  });

  describe('users', () => {
    it('login with password', async () => {
      const users = db.collection('users');
      await users.findOrInsertOne(Admin);
      const { data } = await apolloFetch({
        query: /* GraphQL */ `
          mutation {
            loginWithPassword(username: "admin", plainPassword: "password") {
              id
            }
          }
        `
      });
      expect(data).toEqual({
        loginWithPassword: {
          id: 'admin'
        }
      });
    });
  });

  describe('currencies', () => {
    it('add a currency', async () => {
      const {
        data: { createCurrency }
      } = await apolloFetch({
        query: /* GraphQL */ `
          mutation {
            createCurrency(currency: { isoCode: "chf" }) {
              _id
              isoCode
              isActive
            }
          }
        `
      });
      expect(createCurrency).toMatchObject({
        isoCode: 'CHF',
        isActive: true
      });
    });

    it('update a currency', async () => {
      const currencies = db.collection('currencies');
      const currency = await currencies.findOne();

      const { data: { updateCurrency } = {}, errors } = await apolloFetch({
        query: /* GraphQL */ `
          mutation updateCurrency(
            $currencyId: ID!
            $currency: UpdateCurrencyInput!
          ) {
            updateCurrency(currencyId: $currencyId, currency: $currency) {
              _id
              isoCode
              isActive
            }
          }
        `,
        variables: {
          currencyId: currency._id,
          currency: {
            isoCode: 'btc',
            isActive: true
          }
        }
      });
      expect(errors).toEqual(undefined);
      expect(updateCurrency).toMatchObject({
        isoCode: 'BTC',
        isActive: true
      });
    });

    it('remove a currency', async () => {
      const currencies = db.collection('currencies');
      await currencies.insertOne({ _id: 'ltc', isoCode: 'LTC' });
      const { data: { removeCurrency } = {}, errors } = await apolloFetch({
        query: /* GraphQL */ `
          mutation {
            removeCurrency(currencyId: "ltc") {
              _id
              isoCode
            }
          }
        `
      });
      expect(errors).toEqual(undefined);
      expect(removeCurrency).toMatchObject({
        isoCode: 'LTC'
      });
    });
  });

  describe('countries', () => {
    it('add a country', async () => {
      const {
        data: { createCountry }
      } = await apolloFetch({
        query: /* GraphQL */ `
          mutation {
            createCountry(country: { isoCode: "ch" }) {
              _id
              isoCode
              isActive
              isBase
              defaultCurrency {
                _id
              }
              flagEmoji
              name(forceLocale: "en")
            }
          }
        `
      });
      expect(createCountry).toMatchObject({
        isoCode: 'CH',
        isActive: true,
        flagEmoji: '🇨🇭',
        name: 'Switzerland'
      });
    });

    it('set the base country', async () => {
      const countries = db.collection('countries');
      const country = await countries.findOne();

      const {
        data: { setBaseCountry },
        errors
      } = await apolloFetch({
        query: /* GraphQL */ `
          mutation setBaseCountry($countryId: ID!) {
            setBaseCountry(countryId: $countryId) {
              isBase
            }
          }
        `,
        variables: {
          countryId: country._id
        }
      });
      expect(errors).toEqual(undefined);
      expect(setBaseCountry).toMatchObject({
        isBase: true
      });
    });

    it('update a country', async () => {
      const countries = db.collection('countries');
      const currencies = db.collection('currencies');

      const country = await countries.findOne();
      const currency = await currencies.findOne();

      const { data: { updateCountry } = {}, errors } = await apolloFetch({
        query: /* GraphQL */ `
          mutation updateCountry(
            $countryId: ID!
            $country: UpdateCountryInput!
          ) {
            updateCountry(countryId: $countryId, country: $country) {
              _id
              isoCode
              isActive
              defaultCurrency {
                _id
                isoCode
              }
            }
          }
        `,
        variables: {
          countryId: country._id,
          country: {
            isoCode: 'CH',
            isActive: true,
            defaultCurrencyId: currency._id
          }
        }
      });
      expect(errors).toEqual(undefined);
      expect(updateCountry).toMatchObject({
        isoCode: 'CH',
        isActive: true,
        defaultCurrency: { _id: currency._id, isoCode: currency.isoCode }
      });
    });

    it('remove a country', async () => {
      const countries = db.collection('countries');
      await countries.insertOne({ _id: 'us', isoCode: 'US' });
      const { data: { removeCountry } = {}, errors } = await apolloFetch({
        query: /* GraphQL */ `
          mutation {
            removeCountry(countryId: "us") {
              _id
              isoCode
            }
          }
        `
      });
      expect(errors).toEqual(undefined);
      expect(removeCountry).toMatchObject({
        isoCode: 'US'
      });
    });
  });
});
