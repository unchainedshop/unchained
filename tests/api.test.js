const { setupDB, createAdminApolloFetch } = require('./helpers');
const { Admin } = require('./seeds/users');

let connection;
let db;
let apolloFetch;

describe('shop configuration', () => {
  beforeAll(async () => {
    [db, connection] = await setupDB();
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
        data: { setBaseCountry }
      } = await apolloFetch({
        query: /* GraphQL */ `
        mutation {
          setBaseCountry(countryId: "${country._id}") {
            isBase
          }
        }
      `
      });
      expect(setBaseCountry).toMatchObject({
        isBase: true
      });
    });

    it('update a country', async () => {
      const countries = db.collection('countries');
      const currencies = db.collection('currencies');

      const country = await countries.findOne();
      const currency = await currencies.findOne();

      const {
        data: { updateCountry }
      } = await apolloFetch({
        query: /* GraphQL */ `
        mutation {
          updateCountry(countryId: "${
            country._id
          }", country: { isoCode: "CH", isActive: true, defaultCurrencyId: "${
          currency._id
        }" }) {
            _id
            isoCode
            isActive
            defaultCurrency {
              _id
              isoCode
            }
          }
        }
      `
      });
      expect(updateCountry).toMatchObject({
        isoCode: 'CH',
        isActive: true,
        defaultCurrency: { _id: currency._id, isoCode: currency.isoCode }
      });
    });

    it('remove a country', async () => {
      const countries = db.collection('countries');
      await countries.insertOne({ _id: 'us', isoCode: 'US' });
      const {
        data: { removeCountry }
      } = await apolloFetch({
        query: /* GraphQL */ `
          mutation {
            removeCountry(countryId: "us") {
              _id
              isoCode
            }
          }
        `
      });
      expect(removeCountry).toMatchObject({
        isoCode: 'US'
      });
    });
  });
});
