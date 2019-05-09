const { setupDatabase, createAdminApolloFetch } = require('./helpers');

let connection;
let db;
let apolloFetch;

describe('basic setup of internationalization and localization context', () => {
  beforeAll(async () => {
    [db, connection] = await setupDatabase();
    apolloFetch = await createAdminApolloFetch();
  });

  afterAll(async () => {
    await connection.close();
  });

  describe('currencies', () => {
    it('add a currency', async () => {
      const {
        data: { createCurrency }
      } = await apolloFetch({
        query: /* GraphQL */ `
          mutation {
            createCurrency(currency: { isoCode: "btc" }) {
              _id
              isoCode
              isActive
            }
          }
        `
      });
      expect(createCurrency).toMatchObject({
        isoCode: 'BTC',
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
            isoCode: 'chf',
            isActive: true
          }
        }
      });
      expect(errors).toEqual(undefined);
      expect(updateCurrency).toMatchObject({
        isoCode: 'CHF',
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
      // TODO: Currencies should have delete flags, as orders can depend on them
      expect(await currencies.countDocuments({ _id: 'ltc' })).toEqual(0);
    });

    it('query active currencies', async () => {
      const Currencies = db.collection('currencies');
      await Currencies.insertOne({
        _id: 'ltc',
        isoCode: 'LTC',
        isActive: true
      });
      await Currencies.insertOne({
        _id: 'btc',
        isoCode: 'BTC',
        isActive: false
      });

      const { data: { currencies } = {}, errors } = await apolloFetch({
        query: /* GraphQL */ `
          query {
            currencies {
              isoCode
            }
          }
        `
      });
      expect(errors).toEqual(undefined);
      expect(currencies).toEqual([
        {
          isoCode: 'CHF'
        },
        {
          isoCode: 'LTC'
        }
      ]);
    });

    it('query single currency', async () => {
      const Currencies = db.collection('currencies');
      await Currencies.insertOne({
        _id: 'sigt',
        isoCode: 'SIGT',
        isActive: false
      });

      const { data: { currency } = {}, errors } = await apolloFetch({
        query: /* GraphQL */ `
          query {
            currency(currencyId: "sigt") {
              isoCode
            }
          }
        `
      });
      expect(errors).toEqual(undefined);
      expect(currency).toMatchObject({
        isoCode: 'SIGT'
      });
    });
  });

  describe('countries', () => {
    let Countries;
    beforeEach(() => {
      Countries = db.collection('countries');
    });

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
      const country = await Countries.findOne();

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
      const currencies = db.collection('currencies');
      const country = await Countries.findOne();
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
      await Countries.insertOne({ _id: 'us', isoCode: 'US' });
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
      // TODO: Countries should have delete flags, as orders can depend on them
      expect(await Countries.countDocuments({ _id: 'us' })).toEqual(0);
    });

    it('query active countries', async () => {
      await Countries.insertOne({
        _id: 'uk',
        isoCode: 'UK',
        isActive: true
      });
      await Countries.insertOne({
        _id: 'it',
        isoCode: 'IT',
        isActive: false
      });

      const { data: { countries } = {}, errors } = await apolloFetch({
        query: /* GraphQL */ `
          query {
            countries {
              isoCode
            }
          }
        `
      });
      expect(errors).toEqual(undefined);
      expect(countries).toEqual([
        {
          isoCode: 'CH'
        },
        {
          isoCode: 'UK'
        }
      ]);
    });

    it('query single country', async () => {
      await Countries.insertOne({
        _id: 'de',
        isoCode: 'DE',
        isActive: false
      });

      const { data: { country } = {}, errors } = await apolloFetch({
        query: /* GraphQL */ `
          query {
            country(countryId: "de") {
              isoCode
            }
          }
        `
      });
      expect(errors).toEqual(undefined);
      expect(country).toMatchObject({
        isoCode: 'DE'
      });
    });
  });

  describe('languages', () => {
    it('add a language', async () => {
      const {
        data: { createLanguage }
      } = await apolloFetch({
        query: /* GraphQL */ `
          mutation {
            createLanguage(language: { isoCode: "fr" }) {
              _id
              isoCode
              isActive
              isBase
              name
            }
          }
        `
      });
      expect(createLanguage).toMatchObject({
        isoCode: 'fr',
        isActive: true,
        isBase: false,
        name: 'fr'
      });
    });

    it('set the base language', async () => {
      const languages = db.collection('languages');
      const language = await languages.findOne();

      const {
        data: { setBaseLanguage },
        errors
      } = await apolloFetch({
        query: /* GraphQL */ `
          mutation setBaseLanguage($languageId: ID!) {
            setBaseLanguage(languageId: $languageId) {
              isBase
              name
            }
          }
        `,
        variables: {
          languageId: language._id
        }
      });
      expect(errors).toEqual(undefined);
      expect(setBaseLanguage).toMatchObject({
        isBase: true,
        name: 'fr (Base)'
      });
    });

    it('update a language', async () => {
      const languages = db.collection('languages');
      const language = await languages.findOne();

      const { data: { updateLanguage } = {}, errors } = await apolloFetch({
        query: /* GraphQL */ `
          mutation updateLanguage(
            $languageId: ID!
            $language: UpdateLanguageInput!
          ) {
            updateLanguage(languageId: $languageId, language: $language) {
              _id
              isoCode
              isActive
            }
          }
        `,
        variables: {
          languageId: language._id,
          language: {
            isoCode: 'de',
            isActive: true
          }
        }
      });
      expect(errors).toEqual(undefined);
      expect(updateLanguage).toMatchObject({
        isoCode: 'de',
        isActive: true
      });
    });

    it('remove a language', async () => {
      const languages = db.collection('languages');
      await languages.insertOne({ _id: 'en', isoCode: 'US' });
      const { data: { removeLanguage } = {}, errors } = await apolloFetch({
        query: /* GraphQL */ `
          mutation {
            removeLanguage(languageId: "en") {
              _id
              isoCode
            }
          }
        `
      });
      expect(errors).toEqual(undefined);
      expect(removeLanguage).toMatchObject({
        isoCode: 'US'
      });
      // TODO: Currencies should have delete flags, as orders can depend on them
      expect(await languages.countDocuments({ _id: 'en' })).toEqual(0);
    });
  });

  it('user defaults', async () => {
    const {
      data: { me }
    } = await apolloFetch({
      query: /* GraphQL */ `
        query {
          me {
            language {
              isoCode
            }
            country {
              isoCode
            }
          }
        }
      `
    });
    expect(me).toMatchObject({
      language: {
        isoCode: 'de'
      },
      country: {
        isoCode: 'CH'
      }
    });
  });

  it('global shop context', async () => {
    const {
      data: { shopInfo }
    } = await apolloFetch({
      query: /* GraphQL */ `
        query {
          shopInfo {
            _id
            language {
              isoCode
            }
            country {
              isoCode
              defaultCurrency {
                isoCode
              }
            }
            version
            userRoles
          }
        }
      `
    });
    expect(shopInfo).toMatchObject({
      _id: 'root',
      language: {
        isoCode: 'de'
      },
      country: {
        isoCode: 'CH',
        defaultCurrency: {
          isoCode: 'CHF'
        }
      },
      userRoles: ['admin']
    });
  });
});
