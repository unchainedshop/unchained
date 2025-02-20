import { setupDatabase, createLoggedInGraphqlFetch } from './helpers.js';
import assert from 'node:assert';
import test from 'node:test';

let db;
let graphqlFetch;
let Currencies;
let Countries;
let Languages;

test.describe('basic setup of internationalization and localization context', () => {
  test.before(async () => {
    [db] = await setupDatabase();
    graphqlFetch = createLoggedInGraphqlFetch();
    Currencies = db.collection('currencies');
    Countries = db.collection('countries');
    Languages = db.collection('languages');
  });

  test.describe('currencies', () => {
    test('add a currency', async () => {
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
      assert.strictEqual(errors, undefined);
      assert.deepStrictEqual(createCurrency, {
        isoCode: 'BTC',
        isActive: true,
      });
      await Currencies.deleteOne({ isoCode: 'BTC' });
    });

    test('update a currency', async () => {
      const currency = await Currencies.findOne();

      const { data: { updateCurrency } = {}, errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation updateCurrency($currencyId: ID!, $currency: UpdateCurrencyInput!) {
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
      assert.strictEqual(errors, undefined);
      assert.deepStrictEqual(updateCurrency, {
        isoCode: 'CHF',
        isActive: true,
      });
    });

    test('return not found error when passed non existing currencyId', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation updateCurrency($currencyId: ID!, $currency: UpdateCurrencyInput!) {
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
      assert.strictEqual(errors[0]?.extensions?.code, 'CurrencyNotFoundError');
    });

    test('return error when passed invalid currencyId', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation updateCurrency($currencyId: ID!, $currency: UpdateCurrencyInput!) {
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
      assert.strictEqual(errors[0]?.extensions?.code, 'InvalidIdError');
    });

    test('remove a currency', async () => {
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
      assert.strictEqual(errors, undefined);
      assert.deepStrictEqual(removeCurrency, {
        isoCode: 'LTC',
      });
      assert.strictEqual(await Currencies.countDocuments({ _id: 'ltc', deleted: null }), 0);
      assert.strictEqual(await Currencies.countDocuments({ _id: 'ltc' }), 1);
      await Currencies.deleteOne({ _id: 'ltc' });
    });

    test('return not found error when passed non existing currencyId', async () => {
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
      assert.strictEqual(errors[0]?.extensions?.code, 'CurrencyNotFoundError');
    });

    test('return error when passed invalid currencyId', async () => {
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
      assert.strictEqual(errors[0]?.extensions?.code, 'InvalidIdError');
    });

    test('query active currencies', async () => {
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
              isActive
            }
          }
        `,
      });
      assert.strictEqual(errors, undefined);
      assert.deepStrictEqual(currencies, [
        {
          isoCode: 'CHF',
          isActive: true,
        },
        {
          isoCode: 'LTC',
          isActive: true,
        },
      ]);
      await Currencies.deleteOne({ _id: 'ltc' });
      await Currencies.deleteOne({ _id: 'btc' });
    });

    test('query inactive single currency', async () => {
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
      assert.strictEqual(errors, undefined);
      assert.deepStrictEqual(currency, {
        isoCode: 'SIGT',
      });
      await Currencies.deleteOne({ _id: 'sigt' });
    });

    test('query.currency return error when passed invalid ID', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          query {
            currency(currencyId: "") {
              isoCode
            }
          }
        `,
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'InvalidIdError');
    });
  });

  test.describe('countries', () => {
    test('add a country', async () => {
      const {
        data: { createCountry },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation {
            createCountry(country: { isoCode: "nl" }) {
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
      assert.deepStrictEqual(createCountry, {
        isoCode: 'NL',
        isActive: true,
        flagEmoji: '🇳🇱',
        name: 'Netherlands',
      });
      await Countries.deleteOne({ isoCode: 'NL' });
    });

    test('update a country', async () => {
      const Currencies = db.collection('currencies');
      const country = await Countries.findOne();
      const currency = await Currencies.findOne();

      const { data: { updateCountry } = {}, errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation updateCountry($countryId: ID!, $country: UpdateCountryInput!) {
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
            defaultCurrencyCode: currency.isoCode,
          },
        },
      });
      assert.strictEqual(errors, undefined);
      assert.deepStrictEqual(updateCountry, {
        isoCode: 'CH',
        isActive: true,
        defaultCurrency: { _id: currency._id, isoCode: currency.isoCode },
      });
    });

    test('return error when passed invalid countryId', async () => {
      const Currencies = db.collection('currencies');
      const currency = await Currencies.findOne();

      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation updateCountry($countryId: ID!, $country: UpdateCountryInput!) {
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
            defaultCurrencyCode: currency.isoCode,
          },
        },
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'InvalidIdError');
    });

    test('return not found error when passed non existing countryId', async () => {
      const Currencies = db.collection('currencies');
      const currency = await Currencies.findOne();

      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation updateCountry($countryId: ID!, $country: UpdateCountryInput!) {
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
            defaultCurrencyCode: currency.isoCode,
          },
        },
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'CountryNotFoundError');
    });

    test('remove a country', async () => {
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
      assert.strictEqual(errors, undefined);
      assert.deepStrictEqual(removeCountry, {
        isoCode: 'US',
      });
      assert.strictEqual(await Countries.countDocuments({ _id: 'us', deleted: null }), 0);
      assert.strictEqual(await Countries.countDocuments({ _id: 'us' }), 1);
      await Countries.deleteOne({ _id: 'us' });
    });

    test('return not found error when passed non existing country ID', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation {
            removeCountry(countryId: "ethiopia") {
              _id
            }
          }
        `,
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'CountryNotFoundError');
    });

    test('return error when passed invalid country ID', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation {
            removeCountry(countryId: "") {
              _id
            }
          }
        `,
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'InvalidIdError');
    });

    test('query active countries', async () => {
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
      assert.strictEqual(errors, undefined);
      assert.deepStrictEqual(countries, [
        {
          isoCode: 'CH',
        },
        {
          isoCode: 'UK',
        },
      ]);
      await Countries.deleteOne({ _id: 'it' });
      await Countries.deleteOne({ _id: 'uk' });
    });

    test('query.country inactive single country', async () => {
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
      assert.strictEqual(errors, undefined);
      assert.deepStrictEqual(country, {
        isoCode: 'DE',
      });
      await Countries.deleteOne({ _id: 'de' });
    });

    test('query.country return error when passed invalid ID', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          query {
            country(countryId: "") {
              isoCode
            }
          }
        `,
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'InvalidIdError');
    });
  });

  test.describe('languages', () => {
    test('add a language', async () => {
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
      assert.deepStrictEqual(createLanguage, {
        isoCode: 'fr',
        isActive: true,
        isBase: false,
        name: 'fr',
      });
      await Languages.deleteOne({ isoCode: 'fr' });
    });

    test('update a language', async () => {
      const language = await Languages.findOne();

      const { data: { updateLanguage } = {}, errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation updateLanguage($languageId: ID!, $language: UpdateLanguageInput!) {
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
      assert.strictEqual(errors, undefined);
      assert.deepStrictEqual(updateLanguage, {
        isoCode: 'de',
        isActive: true,
      });
    });

    test('return not found error when passed non existing languageId', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation updateLanguage($languageId: ID!, $language: UpdateLanguageInput!) {
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
      assert.strictEqual(errors[0]?.extensions?.code, 'LanguageNotFoundError');
    });

    test('return error when passed invalid languageId', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation updateLanguage($languageId: ID!, $language: UpdateLanguageInput!) {
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
      assert.strictEqual(errors[0]?.extensions?.code, 'InvalidIdError');
    });

    test('remove a language', async () => {
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
      assert.strictEqual(errors, undefined);
      assert.deepStrictEqual(removeLanguage, {
        isoCode: 'US',
      });
      assert.strictEqual(await Languages.countDocuments({ _id: 'en', deleted: null }), 0);
      assert.strictEqual(await Languages.countDocuments({ _id: 'en' }), 1);
      await Languages.deleteOne({ _id: 'en' });
    });

    test('return not found error when passed non existing languageId', async () => {
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
      assert.strictEqual(errors[0]?.extensions?.code, 'LanguageNotFoundError');
    });

    test('return error when passed invalid languageId', async () => {
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
      assert.strictEqual(errors[0]?.extensions?.code, 'InvalidIdError');
    });

    test('query active languages', async () => {
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
      assert.strictEqual(errors, undefined);
      assert.deepStrictEqual(languages, [
        {
          isoCode: 'de',
        },
        {
          isoCode: 'es',
        },
      ]);
      await Languages.deleteOne({ _id: 'es' });
      await Languages.deleteOne({ _id: 'ru' });
    });

    test('query inactive single language', async () => {
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
      assert.strictEqual(errors, undefined);
      assert.deepStrictEqual(language, {
        isoCode: 'pl',
      });
      await Languages.deleteOne({ _id: 'pl' });
    });

    test('query.language return error when passed invalid languageId', async () => {
      const { data: { language } = {}, errors } = await graphqlFetch({
        query: /* GraphQL */ `
          query {
            language(languageId: "") {
              isoCode
            }
          }
        `,
      });
      assert.strictEqual(language, null);
      assert.strictEqual(errors[0]?.extensions?.code, 'InvalidIdError');
    });
  });

  test.describe('resolved locale context', () => {
    test('user defaults', async () => {
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
      assert.deepStrictEqual(me, {
        language: {
          isoCode: 'de',
        },
        country: {
          isoCode: 'CH',
        },
      });
    });

    test('global shop context', async () => {
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
      assert.deepStrictEqual(shopInfo, {
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
});
