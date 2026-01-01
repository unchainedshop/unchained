import { setupDatabase, disconnect } from './helpers.js';
import { ADMIN_TOKEN, USER_TOKEN } from './seeds/users.js';
import { BaseCountry, GermanyCountry, FranceCountry, InactiveCountry } from './seeds/locale-data.js';
import { countries } from '@unchainedshop/core-countries';
import { currencies } from '@unchainedshop/core-currencies';
import { eq, sql, isNull, and } from 'drizzle-orm';
import assert from 'node:assert';
import test from 'node:test';

let createLoggedInGraphqlFetch;
let createAnonymousGraphqlFetch;

test.describe('Country', () => {
  let graphqlFetch;
  let graphqlFetchAsNormalUser;
  let graphqlFetchAsAnonymousUser;
  let db;

  test.before(async () => {
    ({ createLoggedInGraphqlFetch, createAnonymousGraphqlFetch, db } = await setupDatabase());
    graphqlFetch = createLoggedInGraphqlFetch(ADMIN_TOKEN);
    graphqlFetchAsNormalUser = createLoggedInGraphqlFetch(USER_TOKEN);
    graphqlFetchAsAnonymousUser = createAnonymousGraphqlFetch();
  });

  test.after(async () => {
    await disconnect();
  });

  test.describe('Query.countries for admin user', () => {
    test('Return all active countries when no arguments passed', async () => {
      const {
        data: { countries },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query Countries {
            countries {
              _id
              isoCode
              isActive
            }
          }
        `,
        variables: {},
      });
      assert.strictEqual(countries.length, 3);
    });

    test('Return all countries with all fields', async () => {
      const {
        data: { countries },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query Countries {
            countries {
              _id
              isoCode
              isActive
              isBase
              name
              defaultCurrency {
                _id
                isoCode
              }
            }
          }
        `,
        variables: {},
      });
      assert.strictEqual(countries.length, 3);
      assert.ok(countries.every((c) => typeof c._id === 'string'));
      assert.ok(countries.every((c) => typeof c.isoCode === 'string'));
      assert.ok(countries.every((c) => typeof c.isActive === 'boolean'));
    });

    test('Return all countries including inactive', async () => {
      const {
        data: { countries },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query Countries($includeInactive: Boolean) {
            countries(includeInactive: $includeInactive) {
              _id
              isoCode
              isActive
            }
          }
        `,
        variables: {
          includeInactive: true,
        },
      });
      assert.strictEqual(countries.length, 4);
      const inactiveCountry = countries.find((c) => c._id === InactiveCountry._id);
      assert.strictEqual(inactiveCountry.isActive, false);
    });

    test('Return countries with limit', async () => {
      const {
        data: { countries },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query Countries($limit: Int) {
            countries(limit: $limit) {
              _id
              isoCode
            }
          }
        `,
        variables: {
          limit: 2,
        },
      });
      assert.strictEqual(countries.length, 2);
    });

    test('Return countries with offset', async () => {
      const {
        data: { countries },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query Countries($offset: Int) {
            countries(offset: $offset) {
              _id
              isoCode
            }
          }
        `,
        variables: {
          offset: 1,
        },
      });
      assert.strictEqual(countries.length, 2);
    });

    test('Return countries with limit and offset', async () => {
      const {
        data: { countries },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query Countries($limit: Int, $offset: Int) {
            countries(limit: $limit, offset: $offset) {
              _id
              isoCode
            }
          }
        `,
        variables: {
          limit: 1,
          offset: 1,
        },
      });
      assert.strictEqual(countries.length, 1);
    });

    test('Return country search result', async () => {
      const {
        data: { countries },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query Countries($queryString: String) {
            countries(queryString: $queryString) {
              _id
              isoCode
            }
          }
        `,
        variables: {
          queryString: 'CH',
        },
      });
      assert.strictEqual(countries.length, 1);
      assert.deepStrictEqual(countries, [
        {
          _id: BaseCountry._id,
          isoCode: BaseCountry.isoCode,
        },
      ]);
    });

    test('Return countries sorted by isoCode ascending', async () => {
      const {
        data: { countries },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query Countries($sort: [SortOptionInput!]) {
            countries(sort: $sort) {
              _id
              isoCode
            }
          }
        `,
        variables: {
          sort: [{ key: 'isoCode', value: 'ASC' }],
        },
      });
      assert.strictEqual(countries.length, 3);
      assert.strictEqual(countries[0]._id, BaseCountry._id);
      assert.strictEqual(countries[2]._id, FranceCountry._id);
    });

    test('Return countries sorted by isoCode descending', async () => {
      const {
        data: { countries },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query Countries($sort: [SortOptionInput!]) {
            countries(sort: $sort) {
              _id
              isoCode
            }
          }
        `,
        variables: {
          sort: [{ key: 'isoCode', value: 'DESC' }],
        },
      });
      assert.strictEqual(countries.length, 3);
      assert.strictEqual(countries[0]._id, FranceCountry._id);
      assert.strictEqual(countries[2]._id, BaseCountry._id);
    });

    test('Return empty array when no matching search result found', async () => {
      const {
        data: { countries },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query Countries($queryString: String) {
            countries(queryString: $queryString) {
              _id
              isoCode
            }
          }
        `,
        variables: {
          queryString: 'wrong',
        },
      });
      assert.strictEqual(countries.length, 0);
    });
  });

  test.describe('Query.countries for normal user', () => {
    test('Return all active countries', async () => {
      const {
        data: { countries },
      } = await graphqlFetchAsNormalUser({
        query: /* GraphQL */ `
          query Countries {
            countries {
              _id
              isoCode
            }
          }
        `,
        variables: {},
      });
      assert.strictEqual(countries.length, 3);
    });

    test('Return country search result', async () => {
      const {
        data: { countries },
      } = await graphqlFetchAsNormalUser({
        query: /* GraphQL */ `
          query Countries($queryString: String) {
            countries(queryString: $queryString) {
              _id
              isoCode
            }
          }
        `,
        variables: {
          queryString: 'DE',
        },
      });
      assert.strictEqual(countries.length, 1);
      assert.strictEqual(countries[0]._id, GermanyCountry._id);
    });
  });

  test.describe('Query.countries for anonymous user', () => {
    test('Return all active countries', async () => {
      const {
        data: { countries },
      } = await graphqlFetchAsAnonymousUser({
        query: /* GraphQL */ `
          query Countries {
            countries {
              _id
              isoCode
            }
          }
        `,
        variables: {},
      });
      assert.strictEqual(countries.length, 3);
    });

    test('Return country search result', async () => {
      const {
        data: { countries },
      } = await graphqlFetchAsAnonymousUser({
        query: /* GraphQL */ `
          query Countries($queryString: String) {
            countries(queryString: $queryString) {
              _id
              isoCode
            }
          }
        `,
        variables: {
          queryString: 'FR',
        },
      });
      assert.strictEqual(countries.length, 1);
      assert.strictEqual(countries[0]._id, FranceCountry._id);
    });
  });

  test.describe('Query.country for admin user', () => {
    test('Return single country by ID', async () => {
      const {
        data: { country },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query Country($countryId: ID!) {
            country(countryId: $countryId) {
              _id
              isoCode
              isActive
              isBase
              name
              defaultCurrency {
                _id
                isoCode
              }
            }
          }
        `,
        variables: {
          countryId: BaseCountry._id,
        },
      });
      assert.strictEqual(country._id, BaseCountry._id);
      assert.strictEqual(country.isoCode, BaseCountry.isoCode);
      assert.strictEqual(typeof country.isActive, 'boolean');
      assert.strictEqual(typeof country.isBase, 'boolean');
      assert.strictEqual(typeof country.name, 'string');
    });

    test('Return null for non-existing country ID', async () => {
      const {
        data: { country },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query Country($countryId: ID!) {
            country(countryId: $countryId) {
              _id
              isoCode
            }
          }
        `,
        variables: {
          countryId: 'non-existing-id',
        },
      });
      assert.strictEqual(country, null);
    });
  });

  test.describe('Query.country for normal user', () => {
    test('Return single country by ID', async () => {
      const {
        data: { country },
      } = await graphqlFetchAsNormalUser({
        query: /* GraphQL */ `
          query Country($countryId: ID!) {
            country(countryId: $countryId) {
              _id
              isoCode
              isActive
            }
          }
        `,
        variables: {
          countryId: GermanyCountry._id,
        },
      });
      assert.strictEqual(country._id, GermanyCountry._id);
      assert.strictEqual(country.isoCode, GermanyCountry.isoCode);
    });

    test('Return null for non-existing country ID', async () => {
      const {
        data: { country },
      } = await graphqlFetchAsNormalUser({
        query: /* GraphQL */ `
          query Country($countryId: ID!) {
            country(countryId: $countryId) {
              _id
              isoCode
            }
          }
        `,
        variables: {
          countryId: 'non-existing-id',
        },
      });
      assert.strictEqual(country, null);
    });
  });

  test.describe('Query.country for anonymous user', () => {
    test('Return single country by ID', async () => {
      const {
        data: { country },
      } = await graphqlFetchAsAnonymousUser({
        query: /* GraphQL */ `
          query Country($countryId: ID!) {
            country(countryId: $countryId) {
              _id
              isoCode
              isActive
            }
          }
        `,
        variables: {
          countryId: FranceCountry._id,
        },
      });
      assert.strictEqual(country._id, FranceCountry._id);
      assert.strictEqual(country.isoCode, FranceCountry.isoCode);
    });

    test('Return null for non-existing country ID', async () => {
      const {
        data: { country },
      } = await graphqlFetchAsAnonymousUser({
        query: /* GraphQL */ `
          query Country($countryId: ID!) {
            country(countryId: $countryId) {
              _id
              isoCode
            }
          }
        `,
        variables: {
          countryId: 'non-existing-id',
        },
      });
      assert.strictEqual(country, null);
    });
  });

  test.describe('Query.countriesCount for admin user', () => {
    test('Return count of all active countries when no arguments passed', async () => {
      const {
        data: { countriesCount },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query {
            countriesCount
          }
        `,
        variables: {},
      });
      assert.strictEqual(countriesCount, 3);
    });

    test('Return count of all countries including inactive', async () => {
      const {
        data: { countriesCount },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query CountriesCount($includeInactive: Boolean) {
            countriesCount(includeInactive: $includeInactive)
          }
        `,
        variables: {
          includeInactive: true,
        },
      });
      assert.strictEqual(countriesCount, 4);
    });

    test('Return count of countries filtered by queryString', async () => {
      const {
        data: { countriesCount },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query CountriesCount($queryString: String) {
            countriesCount(queryString: $queryString)
          }
        `,
        variables: {
          queryString: 'CH',
        },
      });
      assert.strictEqual(countriesCount, 1);
    });

    test('Return count with combined filters', async () => {
      const {
        data: { countriesCount },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query CountriesCount($includeInactive: Boolean, $queryString: String) {
            countriesCount(includeInactive: $includeInactive, queryString: $queryString)
          }
        `,
        variables: {
          includeInactive: true,
          queryString: 'US',
        },
      });
      assert.strictEqual(countriesCount, 1);
    });

    test('Return 0 for non-matching queryString', async () => {
      const {
        data: { countriesCount },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query CountriesCount($queryString: String) {
            countriesCount(queryString: $queryString)
          }
        `,
        variables: {
          queryString: 'wrong',
        },
      });
      assert.strictEqual(countriesCount, 0);
    });
  });

  test.describe('Query.countriesCount for normal user', () => {
    test('Return count of all active countries', async () => {
      const {
        data: { countriesCount },
      } = await graphqlFetchAsNormalUser({
        query: /* GraphQL */ `
          query {
            countriesCount
          }
        `,
        variables: {},
      });
      assert.strictEqual(countriesCount, 3);
    });

    test('Return count of countries filtered by queryString', async () => {
      const {
        data: { countriesCount },
      } = await graphqlFetchAsNormalUser({
        query: /* GraphQL */ `
          query CountriesCount($queryString: String) {
            countriesCount(queryString: $queryString)
          }
        `,
        variables: {
          queryString: 'DE',
        },
      });
      assert.strictEqual(countriesCount, 1);
    });
  });

  test.describe('Query.countriesCount for anonymous user', () => {
    test('Return count of all active countries', async () => {
      const {
        data: { countriesCount },
      } = await graphqlFetchAsAnonymousUser({
        query: /* GraphQL */ `
          query {
            countriesCount
          }
        `,
        variables: {},
      });
      assert.strictEqual(countriesCount, 3);
    });

    test('Return count of countries filtered by queryString', async () => {
      const {
        data: { countriesCount },
      } = await graphqlFetchAsAnonymousUser({
        query: /* GraphQL */ `
          query CountriesCount($queryString: String) {
            countriesCount(queryString: $queryString)
          }
        `,
        variables: {
          queryString: 'FR',
        },
      });
      assert.strictEqual(countriesCount, 1);
    });
  });

  test.describe('countries', () => {
    test('add a country', async () => {
      const result = await graphqlFetch({
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
      const { data, errors } = result;
      assert.strictEqual(errors, undefined, `GraphQL errors: ${JSON.stringify(errors)}`);
      assert.ok(data, `Data is null, result: ${JSON.stringify(result)}`);
      const { createCountry } = data;
      assert.partialDeepStrictEqual(createCountry, {
        isoCode: 'NL',
        isActive: true,
        flagEmoji: '🇳🇱',
        name: 'Netherlands',
      });
      await db.delete(countries).where(eq(countries.isoCode, 'NL'));
    });

    test('update a country', async () => {
      const [country] = await db.select().from(countries).limit(1);
      const [currency] = await db.select().from(currencies).limit(1);

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
            isoCode: 'et',
            isActive: true,
            defaultCurrencyCode: currency.isoCode,
          },
        },
      });
      assert.strictEqual(errors, undefined);
      assert.partialDeepStrictEqual(updateCountry, {
        isoCode: 'et',
        isActive: true,
        defaultCurrency: { _id: currency._id, isoCode: currency.isoCode },
      });
    });

    test('return error when passed invalid countryId', async () => {
      const [currency] = await db.select().from(currencies).limit(1);

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
      const [currency] = await db.select().from(currencies).limit(1);

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
      await db
        .insert(countries)
        .values({ _id: 'et', isoCode: 'ET', created: new Date(), deleted: null });
      const { data: { removeCountry } = {}, errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation {
            removeCountry(countryId: "et") {
              _id
              isoCode
            }
          }
        `,
      });
      assert.strictEqual(errors, undefined);
      assert.partialDeepStrictEqual(removeCountry, {
        isoCode: 'ET',
      });
      const [notDeletedCount] = await db
        .select({ count: sql`count(*)` })
        .from(countries)
        .where(and(eq(countries._id, 'et'), isNull(countries.deleted)));
      assert.strictEqual(Number(notDeletedCount.count), 0);
      const [totalCount] = await db
        .select({ count: sql`count(*)` })
        .from(countries)
        .where(eq(countries._id, 'et'));
      assert.strictEqual(Number(totalCount.count), 1);
      await db.delete(countries).where(eq(countries._id, 'et'));
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
      await db.insert(countries).values({
        _id: 'uk',
        isoCode: 'UK',
        isActive: true,
        created: new Date(),
        deleted: null,
      });
      await db.insert(countries).values({
        _id: 'it',
        isoCode: 'IT',
        isActive: false,
        created: new Date(),
        deleted: null,
      });

      const { data: { countries: countriesData } = {}, errors } = await graphqlFetch({
        query: /* GraphQL */ `
          query {
            countries {
              isoCode
            }
          }
        `,
      });
      assert.strictEqual(errors, undefined);
      assert.ok(countriesData?.length >= 2);
      await db.delete(countries).where(eq(countries._id, 'it'));
      await db.delete(countries).where(eq(countries._id, 'uk'));
    });

    test('query.country inactive single country', async () => {
      await db.insert(countries).values({
        _id: 'et',
        isoCode: 'ET',
        isActive: false,
        created: new Date(),
        deleted: null,
      });

      const { data: { country } = {}, errors } = await graphqlFetch({
        query: /* GraphQL */ `
          query {
            country(countryId: "et") {
              isoCode
            }
          }
        `,
      });
      assert.strictEqual(errors, undefined);
      assert.deepStrictEqual(country, {
        isoCode: 'ET',
      });
      await db.delete(countries).where(eq(countries._id, 'et'));
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
});
