import { setupDatabase, createLoggedInGraphqlFetch } from './helpers';

let connection;
let db;
let graphqlFetch;

describe('basic setup of internationalization and localization context', () => {
  beforeAll(async () => {
    [db, connection] = await setupDatabase();
    graphqlFetch = await createLoggedInGraphqlFetch();
  });

  afterAll(async () => {
    await connection.close();
  });

  describe('currencies', () => {
    let Currencies;
    beforeAll(() => {
      Currencies = db.collection('currencies');
    });

    it('add a currency', async () => {
      const {
        data: { createCurrency },
        errors,
      } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation {
            createCurrency(currency: { isoCode: "btc" }) {
              _id
              isoCode
              isActive
            }
          }
        `,
      });
      expect(errors).toEqual(undefined);
      expect(createCurrency).toMatchObject({
        isoCode: 'BTC',
        isActive: true,
      });
    });

    it('update a currency', async () => {
      const currency = await Currencies.findOne();

      const { data: { updateCurrency } = {}, errors } = await graphqlFetch({
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
            isActive: true,
          },
        },
      });
      expect(errors).toEqual(undefined);
      expect(updateCurrency).toMatchObject({
        isoCode: 'CHF',
        isActive: true,
      });
    });

    it('return not found error when passed non existing currencyId', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation updateCurrency(
            $currencyId: ID!
            $currency: UpdateCurrencyInput!
          ) {
            updateCurrency(currencyId: $currencyId, currency: $currency) {
              _id
            }
          }
        `,
        variables: {
          currencyId: 'non-existing-id',
          currency: {
            isoCode: 'chf',
            isActive: true,
          },
        },
      });
      expect(errors[0]?.extensions?.code).toEqual('CurrencyNotFoundError');
    });

    it('return error when passed invalid currencyId', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation updateCurrency(
            $currencyId: ID!
            $currency: UpdateCurrencyInput!
          ) {
            updateCurrency(currencyId: $currencyId, currency: $currency) {
              _id
            }
          }
        `,
        variables: {
          currencyId: '',
          currency: {
            isoCode: 'chf',
            isActive: true,
          },
        },
      });
      expect(errors[0]?.extensions?.code).toEqual('InvalidIdError');
    });

    it('remove a currency', async () => {
      await Currencies.insertOne({ _id: 'ltc', isoCode: 'LTC' });
      const { data: { removeCurrency } = {}, errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation {
            removeCurrency(currencyId: "ltc") {
              _id
              isoCode
            }
          }
        `,
      });
      expect(errors).toEqual(undefined);
      expect(removeCurrency).toMatchObject({
        isoCode: 'LTC',
      });
      expect(await Currencies.countDocuments({ _id: 'ltc' })).toEqual(0);
    });

    it('return not found error when passed non existing currencyId', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation {
            removeCurrency(currencyId: "ETB") {
              _id
              isoCode
            }
          }
        `,
      });
      expect(errors[0]?.extensions?.code).toEqual('CurrencyNotFoundError');
    });

    it('return error when passed invalid currencyId', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation {
            removeCurrency(currencyId: "") {
              _id
              isoCode
            }
          }
        `,
      });
      expect(errors[0]?.extensions?.code).toEqual('InvalidIdError');
    });

    it.todo(
      'Currencies should have delete flags, as orders can depend on them',
    );

    it('query active currencies', async () => {
      await Currencies.insertOne({
        _id: 'ltc',
        isoCode: 'LTC',
        isActive: true,
      });
      await Currencies.insertOne({
        _id: 'btc',
        isoCode: 'BTC',
        isActive: false,
      });

      const { data: { currencies } = {}, errors } = await graphqlFetch({
        query: /* GraphQL */ `
          query {
            currencies {
              isoCode
            }
          }
        `,
      });
      expect(errors).toEqual(undefined);
      expect(currencies).toEqual([
        {
          isoCode: 'CHF',
        },
        {
          isoCode: 'LTC',
        },
      ]);
    });

    it('query inactive single currency', async () => {
      await Currencies.insertOne({
        _id: 'sigt',
        isoCode: 'SIGT',
        isActive: false,
      });

      const { data: { currency } = {}, errors } = await graphqlFetch({
        query: /* GraphQL */ `
          query {
            currency(currencyId: "sigt") {
              isoCode
            }
          }
        `,
      });
      expect(errors).toEqual(undefined);
      expect(currency).toMatchObject({
        isoCode: 'SIGT',
      });
    });
  });

  describe('countries', () => {
    let Countries;
    beforeAll(() => {
      Countries = db.collection('countries');
    });

    it('add a country', async () => {
      const {
        data: { createCountry },
      } = await graphqlFetch({
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
        `,
      });
      expect(createCountry).toMatchObject({
        isoCode: 'CH',
        isActive: true,
        flagEmoji: '🇨🇭',
        name: 'Switzerland',
      });
    });

    it('set the base country', async () => {
      const country = await Countries.findOne();

      const {
        data: { setBaseCountry },
        errors,
      } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation setBaseCountry($countryId: ID!) {
            setBaseCountry(countryId: $countryId) {
              isBase
            }
          }
        `,
        variables: {
          countryId: country._id,
        },
      });
      expect(errors).toEqual(undefined);
      expect(setBaseCountry).toMatchObject({
        isBase: true,
      });
    });

    it('return not found error when passed non existing countryId', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation setBaseCountry($countryId: ID!) {
            setBaseCountry(countryId: $countryId) {
              isBase
            }
          }
        `,
        variables: {
          countryId: 'non-existing-id',
        },
      });

      expect(errors[0]?.extensions?.code).toEqual('CountryNotFoundError');
    });

    it('return error when passed invalid countryId', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation setBaseCountry($countryId: ID!) {
            setBaseCountry(countryId: $countryId) {
              isBase
            }
          }
        `,
        variables: {
          countryId: '',
        },
      });

      expect(errors[0]?.extensions?.code).toEqual('InvalidIdError');
    });

    it('update a country', async () => {
      const Currencies = db.collection('currencies');
      const country = await Countries.findOne();
      const currency = await Currencies.findOne();

      const { data: { updateCountry } = {}, errors } = await graphqlFetch({
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
            defaultCurrencyId: currency._id,
          },
        },
      });
      expect(errors).toEqual(undefined);
      expect(updateCountry).toMatchObject({
        isoCode: 'CH',
        isActive: true,
        defaultCurrency: { _id: currency._id, isoCode: currency.isoCode },
      });
    });

    it('return error when passed invalid countryId', async () => {
      const Currencies = db.collection('currencies');
      const currency = await Currencies.findOne();

      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation updateCountry(
            $countryId: ID!
            $country: UpdateCountryInput!
          ) {
            updateCountry(countryId: $countryId, country: $country) {
              _id
            }
          }
        `,
        variables: {
          countryId: '',
          country: {
            isoCode: 'CH',
            isActive: true,
            defaultCurrencyId: currency._id,
          },
        },
      });
      expect(errors[0]?.extensions?.code).toEqual('InvalidIdError');
    });

    it('return not found error when passed non existing countryId', async () => {
      const Currencies = db.collection('currencies');
      const currency = await Currencies.findOne();

      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation updateCountry(
            $countryId: ID!
            $country: UpdateCountryInput!
          ) {
            updateCountry(countryId: $countryId, country: $country) {
              _id
            }
          }
        `,
        variables: {
          countryId: 'non-existing',
          country: {
            isoCode: 'CH',
            isActive: true,
            defaultCurrencyId: currency._id,
          },
        },
      });
      expect(errors[0]?.extensions?.code).toEqual('CountryNotFoundError');
    });

    it('remove a country', async () => {
      await Countries.insertOne({ _id: 'us', isoCode: 'US' });
      const { data: { removeCountry } = {}, errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation {
            removeCountry(countryId: "us") {
              _id
              isoCode
            }
          }
        `,
      });
      expect(errors).toEqual(undefined);
      expect(removeCountry).toMatchObject({
        isoCode: 'US',
      });
      expect(await Countries.countDocuments({ _id: 'us' })).toEqual(0);
    });

    it('return not found error when passed non existing country ID', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation {
            removeCountry(countryId: "ethiopia") {
              _id
            }
          }
        `,
      });
      expect(errors[0]?.extensions?.code).toEqual('CountryNotFoundError');
    });

    it('return error when passed invalid country ID', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation {
            removeCountry(countryId: "") {
              _id
            }
          }
        `,
      });
      expect(errors[0]?.extensions?.code).toEqual('InvalidIdError');
    });

    it.todo('Countries should have delete flags, as orders can depend on them');

    it('query active countries', async () => {
      await Countries.insertOne({
        _id: 'uk',
        isoCode: 'UK',
        isActive: true,
      });
      await Countries.insertOne({
        _id: 'it',
        isoCode: 'IT',
        isActive: false,
      });

      const { data: { countries } = {}, errors } = await graphqlFetch({
        query: /* GraphQL */ `
          query {
            countries {
              isoCode
            }
          }
        `,
      });
      expect(errors).toEqual(undefined);
      expect(countries).toEqual([
        {
          isoCode: 'CH',
        },
        {
          isoCode: 'UK',
        },
      ]);
    });

    it('query inactive single country', async () => {
      await Countries.insertOne({
        _id: 'de',
        isoCode: 'DE',
        isActive: false,
      });

      const { data: { country } = {}, errors } = await graphqlFetch({
        query: /* GraphQL */ `
          query {
            country(countryId: "de") {
              isoCode
            }
          }
        `,
      });
      expect(errors).toEqual(undefined);
      expect(country).toMatchObject({
        isoCode: 'DE',
      });
    });
  });

  describe('languages', () => {
    let Languages;
    beforeAll(() => {
      Languages = db.collection('languages');
    });

    it('add a language', async () => {
      const { data: { createLanguage } = {} } = await graphqlFetch({
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
        `,
      });
      expect(createLanguage).toMatchObject({
        isoCode: 'fr',
        isActive: true,
        isBase: false,
        name: 'fr',
      });
    });

    it('set the base language', async () => {
      const language = await Languages.findOne();

      const {
        data: { setBaseLanguage },
        errors,
      } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation setBaseLanguage($languageId: ID!) {
            setBaseLanguage(languageId: $languageId) {
              isBase
              name
            }
          }
        `,
        variables: {
          languageId: language._id,
        },
      });
      expect(errors).toEqual(undefined);
      expect(setBaseLanguage).toMatchObject({
        isBase: true,
        name: 'fr (Base)',
      });
    });

    it('return not found error when passed non-existing languageId', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation setBaseLanguage($languageId: ID!) {
            setBaseLanguage(languageId: $languageId) {
              isBase
              name
            }
          }
        `,
        variables: {
          languageId: 'non-existing-id',
        },
      });
      expect(errors[0]?.extensions?.code).toEqual('LanguageNotFoundError');
    });

    it('return error when passed invalid languageId', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation setBaseLanguage($languageId: ID!) {
            setBaseLanguage(languageId: $languageId) {
              isBase
              name
            }
          }
        `,
        variables: {
          languageId: '',
        },
      });
      expect(errors[0]?.extensions?.code).toEqual('InvalidIdError');
    });

    it('update a language', async () => {
      const language = await Languages.findOne();

      const { data: { updateLanguage } = {}, errors } = await graphqlFetch({
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
            isActive: true,
          },
        },
      });
      expect(errors).toEqual(undefined);
      expect(updateLanguage).toMatchObject({
        isoCode: 'de',
        isActive: true,
      });
    });

    it('return not found error when passed non existing languageId', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation updateLanguage(
            $languageId: ID!
            $language: UpdateLanguageInput!
          ) {
            updateLanguage(languageId: $languageId, language: $language) {
              _id
            }
          }
        `,
        variables: {
          languageId: 'non-existing-id',
          language: {
            isoCode: 'de',
            isActive: true,
          },
        },
      });
      expect(errors[0]?.extensions?.code).toEqual('LanguageNotFoundError');
    });

    it('return error when passed invalid languageId', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation updateLanguage(
            $languageId: ID!
            $language: UpdateLanguageInput!
          ) {
            updateLanguage(languageId: $languageId, language: $language) {
              _id
            }
          }
        `,
        variables: {
          languageId: '',
          language: {
            isoCode: 'de',
            isActive: true,
          },
        },
      });
      expect(errors[0]?.extensions?.code).toEqual('InvalidIdError');
    });

    it('remove a language', async () => {
      await Languages.insertOne({ _id: 'en', isoCode: 'US' });
      const { data: { removeLanguage } = {}, errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation {
            removeLanguage(languageId: "en") {
              _id
              isoCode
            }
          }
        `,
      });
      expect(errors).toEqual(undefined);
      expect(removeLanguage).toMatchObject({
        isoCode: 'US',
      });
      expect(await Languages.countDocuments({ _id: 'en' })).toEqual(0);
    });

    it('return not found error when passed non existing languageId', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation {
            removeLanguage(languageId: "AMH") {
              _id
              isoCode
            }
          }
        `,
      });
      expect(errors[0]?.extensions?.code).toEqual('LanguageNotFoundError');
    });

    it('return error when passed invalid languageId', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation {
            removeLanguage(languageId: "") {
              _id
              isoCode
            }
          }
        `,
      });
      expect(errors[0]?.extensions?.code).toEqual('InvalidIdError');
    });

    it.todo('Languages should have delete flags, as orders can depend on them');

    it('query active languages', async () => {
      await Languages.insertOne({
        _id: 'es',
        isoCode: 'es',
        isActive: true,
      });
      await Languages.insertOne({
        _id: 'ru',
        isoCode: 'ru',
        isActive: false,
      });

      const { data: { languages } = {}, errors } = await graphqlFetch({
        query: /* GraphQL */ `
          query {
            languages {
              isoCode
            }
          }
        `,
      });
      expect(errors).toEqual(undefined);
      expect(languages).toEqual([
        {
          isoCode: 'de',
        },
        {
          isoCode: 'es',
        },
      ]);
    });

    it('query inactive single language', async () => {
      await Languages.insertOne({
        _id: 'pl',
        isoCode: 'pl',
        isActive: false,
      });

      const { data: { language } = {}, errors } = await graphqlFetch({
        query: /* GraphQL */ `
          query {
            language(languageId: "pl") {
              isoCode
            }
          }
        `,
      });
      expect(errors).toEqual(undefined);
      expect(language).toMatchObject({
        isoCode: 'pl',
      });
    });
  });

  it('user defaults', async () => {
    const {
      data: { me },
    } = await graphqlFetch({
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
      `,
    });
    expect(me).toMatchObject({
      language: {
        isoCode: 'de',
      },
      country: {
        isoCode: 'CH',
      },
    });
  });

  it('global shop context', async () => {
    const {
      data: { shopInfo },
    } = await graphqlFetch({
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
      `,
    });
    expect(shopInfo).toMatchObject({
      _id: 'root',
      language: {
        isoCode: 'de',
      },
      country: {
        isoCode: 'CH',
        defaultCurrency: {
          isoCode: 'CHF',
        },
      },
      userRoles: ['admin'],
    });
  });
});
