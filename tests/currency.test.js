import {
  setupDatabase,
  createLoggedInGraphqlFetch,
  disconnect,
  createAnonymousGraphqlFetch,
} from './helpers.js';
import { ADMIN_TOKEN, USER_TOKEN } from './seeds/users.js';
import { BaseCurrency, EuroCurrency, UsdCurrency, InactiveCurrency } from './seeds/locale-data.js';
import assert from 'node:assert';
import test from 'node:test';

test.describe('Currency', () => {
  let graphqlFetch;
  let graphqlFetchAsNormalUser;
  let graphqlFetchAsAnonymousUser;

  test.before(async () => {
    await setupDatabase();
    graphqlFetch = createLoggedInGraphqlFetch(ADMIN_TOKEN);
    graphqlFetchAsNormalUser = createLoggedInGraphqlFetch(USER_TOKEN);
    graphqlFetchAsAnonymousUser = createAnonymousGraphqlFetch();
  });

  test.after(async () => {
    await disconnect();
  });

  test.describe('Query.currencies for admin user', () => {
    test('Return all active currencies when no arguments passed', async () => {
      const {
        data: { currencies },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query Currencies {
            currencies {
              _id
              isoCode
              isActive
            }
          }
        `,
        variables: {},
      });
      assert.strictEqual(currencies.length, 3);
    });

    test('Return all currencies with all fields', async () => {
      const {
        data: { currencies },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query Currencies {
            currencies {
              _id
              isoCode
              isActive
            }
          }
        `,
        variables: {},
      });
      assert.strictEqual(currencies.length, 3);
      assert.ok(currencies.every((c) => typeof c._id === 'string'));
      assert.ok(currencies.every((c) => typeof c.isoCode === 'string'));
      assert.ok(currencies.every((c) => typeof c.isActive === 'boolean'));
    });

    test('Return all currencies including inactive', async () => {
      const {
        data: { currencies },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query Currencies($includeInactive: Boolean) {
            currencies(includeInactive: $includeInactive) {
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
      assert.strictEqual(currencies.length, 4);
      const inactiveCurrency = currencies.find((c) => c._id === InactiveCurrency._id);
      assert.strictEqual(inactiveCurrency.isActive, false);
    });

    test('Return currencies with limit', async () => {
      const {
        data: { currencies },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query Currencies($limit: Int) {
            currencies(limit: $limit) {
              _id
              isoCode
            }
          }
        `,
        variables: {
          limit: 2,
        },
      });
      assert.strictEqual(currencies.length, 2);
    });

    test('Return currencies with offset', async () => {
      const {
        data: { currencies },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query Currencies($offset: Int) {
            currencies(offset: $offset) {
              _id
              isoCode
            }
          }
        `,
        variables: {
          offset: 1,
        },
      });
      assert.strictEqual(currencies.length, 2);
    });

    test('Return currencies with limit and offset', async () => {
      const {
        data: { currencies },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query Currencies($limit: Int, $offset: Int) {
            currencies(limit: $limit, offset: $offset) {
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
      assert.strictEqual(currencies.length, 1);
    });

    test('Return currency search result', async () => {
      const {
        data: { currencies },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query Currencies($queryString: String) {
            currencies(queryString: $queryString) {
              _id
              isoCode
            }
          }
        `,
        variables: {
          queryString: 'CHF',
        },
      });
      assert.strictEqual(currencies.length, 1);
      assert.deepStrictEqual(currencies, [
        {
          _id: BaseCurrency._id,
          isoCode: BaseCurrency.isoCode,
        },
      ]);
    });

    test('Return currencies sorted by isoCode ascending', async () => {
      const {
        data: { currencies },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query Currencies($sort: [SortOptionInput!]) {
            currencies(sort: $sort) {
              _id
              isoCode
            }
          }
        `,
        variables: {
          sort: [{ key: 'isoCode', value: 'ASC' }],
        },
      });
      assert.strictEqual(currencies.length, 3);
      assert.strictEqual(currencies[0]._id, BaseCurrency._id);
      assert.strictEqual(currencies[2]._id, UsdCurrency._id);
    });

    test('Return currencies sorted by isoCode descending', async () => {
      const {
        data: { currencies },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query Currencies($sort: [SortOptionInput!]) {
            currencies(sort: $sort) {
              _id
              isoCode
            }
          }
        `,
        variables: {
          sort: [{ key: 'isoCode', value: 'DESC' }],
        },
      });
      assert.strictEqual(currencies.length, 3);
      assert.strictEqual(currencies[0]._id, UsdCurrency._id);
      assert.strictEqual(currencies[2]._id, BaseCurrency._id);
    });

    test('Return empty array when no matching search result found', async () => {
      const {
        data: { currencies },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query Currencies($queryString: String) {
            currencies(queryString: $queryString) {
              _id
              isoCode
            }
          }
        `,
        variables: {
          queryString: 'wrong',
        },
      });
      assert.strictEqual(currencies.length, 0);
    });
  });

  test.describe('Query.currencies for normal user', () => {
    test('Return all active currencies', async () => {
      const {
        data: { currencies },
      } = await graphqlFetchAsNormalUser({
        query: /* GraphQL */ `
          query Currencies {
            currencies {
              _id
              isoCode
            }
          }
        `,
        variables: {},
      });
      assert.strictEqual(currencies.length, 3);
    });

    test('Return currency search result', async () => {
      const {
        data: { currencies },
      } = await graphqlFetchAsNormalUser({
        query: /* GraphQL */ `
          query Currencies($queryString: String) {
            currencies(queryString: $queryString) {
              _id
              isoCode
            }
          }
        `,
        variables: {
          queryString: 'EUR',
        },
      });
      assert.strictEqual(currencies.length, 1);
      assert.strictEqual(currencies[0]._id, EuroCurrency._id);
    });
  });

  test.describe('Query.currencies for anonymous user', () => {
    test('Return all active currencies', async () => {
      const {
        data: { currencies },
      } = await graphqlFetchAsAnonymousUser({
        query: /* GraphQL */ `
          query Currencies {
            currencies {
              _id
              isoCode
            }
          }
        `,
        variables: {},
      });
      assert.strictEqual(currencies.length, 3);
    });

    test('Return currency search result', async () => {
      const {
        data: { currencies },
      } = await graphqlFetchAsAnonymousUser({
        query: /* GraphQL */ `
          query Currencies($queryString: String) {
            currencies(queryString: $queryString) {
              _id
              isoCode
            }
          }
        `,
        variables: {
          queryString: 'USD',
        },
      });
      assert.strictEqual(currencies.length, 1);
      assert.strictEqual(currencies[0]._id, UsdCurrency._id);
    });
  });

  test.describe('Query.currency for admin user', () => {
    test('Return single currency by ID', async () => {
      const {
        data: { currency },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query Currency($currencyId: ID!) {
            currency(currencyId: $currencyId) {
              _id
              isoCode
              isActive
            }
          }
        `,
        variables: {
          currencyId: BaseCurrency._id,
        },
      });
      assert.strictEqual(currency._id, BaseCurrency._id);
      assert.strictEqual(currency.isoCode, BaseCurrency.isoCode);
      assert.strictEqual(typeof currency.isActive, 'boolean');
    });

    test('Return null for non-existing currency ID', async () => {
      const {
        data: { currency },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query Currency($currencyId: ID!) {
            currency(currencyId: $currencyId) {
              _id
              isoCode
            }
          }
        `,
        variables: {
          currencyId: 'non-existing-id',
        },
      });
      assert.strictEqual(currency, null);
    });
  });

  test.describe('Query.currency for normal user', () => {
    test('Return single currency by ID', async () => {
      const {
        data: { currency },
      } = await graphqlFetchAsNormalUser({
        query: /* GraphQL */ `
          query Currency($currencyId: ID!) {
            currency(currencyId: $currencyId) {
              _id
              isoCode
              isActive
            }
          }
        `,
        variables: {
          currencyId: EuroCurrency._id,
        },
      });
      assert.strictEqual(currency._id, EuroCurrency._id);
      assert.strictEqual(currency.isoCode, EuroCurrency.isoCode);
    });

    test('Return null for non-existing currency ID', async () => {
      const {
        data: { currency },
      } = await graphqlFetchAsNormalUser({
        query: /* GraphQL */ `
          query Currency($currencyId: ID!) {
            currency(currencyId: $currencyId) {
              _id
              isoCode
            }
          }
        `,
        variables: {
          currencyId: 'non-existing-id',
        },
      });
      assert.strictEqual(currency, null);
    });
  });

  test.describe('Query.currency for anonymous user', () => {
    test('Return single currency by ID', async () => {
      const {
        data: { currency },
      } = await graphqlFetchAsAnonymousUser({
        query: /* GraphQL */ `
          query Currency($currencyId: ID!) {
            currency(currencyId: $currencyId) {
              _id
              isoCode
              isActive
            }
          }
        `,
        variables: {
          currencyId: UsdCurrency._id,
        },
      });
      assert.strictEqual(currency._id, UsdCurrency._id);
      assert.strictEqual(currency.isoCode, UsdCurrency.isoCode);
    });

    test('Return null for non-existing currency ID', async () => {
      const {
        data: { currency },
      } = await graphqlFetchAsAnonymousUser({
        query: /* GraphQL */ `
          query Currency($currencyId: ID!) {
            currency(currencyId: $currencyId) {
              _id
              isoCode
            }
          }
        `,
        variables: {
          currencyId: 'non-existing-id',
        },
      });
      assert.strictEqual(currency, null);
    });
  });

  test.describe('Query.currenciesCount for admin user', () => {
    test('Return count of all active currencies when no arguments passed', async () => {
      const {
        data: { currenciesCount },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query {
            currenciesCount
          }
        `,
        variables: {},
      });
      assert.strictEqual(currenciesCount, 3);
    });

    test('Return count of all currencies including inactive', async () => {
      const {
        data: { currenciesCount },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query CurrenciesCount($includeInactive: Boolean) {
            currenciesCount(includeInactive: $includeInactive)
          }
        `,
        variables: {
          includeInactive: true,
        },
      });
      assert.strictEqual(currenciesCount, 4);
    });

    test('Return count of currencies filtered by queryString', async () => {
      const {
        data: { currenciesCount },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query CurrenciesCount($queryString: String) {
            currenciesCount(queryString: $queryString)
          }
        `,
        variables: {
          queryString: 'CHF',
        },
      });
      assert.strictEqual(currenciesCount, 1);
    });

    test('Return count with combined filters', async () => {
      const {
        data: { currenciesCount },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query CurrenciesCount($includeInactive: Boolean, $queryString: String) {
            currenciesCount(includeInactive: $includeInactive, queryString: $queryString)
          }
        `,
        variables: {
          includeInactive: true,
          queryString: 'GBP',
        },
      });
      assert.strictEqual(currenciesCount, 1);
    });

    test('Return 0 for non-matching queryString', async () => {
      const {
        data: { currenciesCount },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query CurrenciesCount($queryString: String) {
            currenciesCount(queryString: $queryString)
          }
        `,
        variables: {
          queryString: 'wrong',
        },
      });
      assert.strictEqual(currenciesCount, 0);
    });
  });

  test.describe('Query.currenciesCount for normal user', () => {
    test('Return count of all active currencies', async () => {
      const {
        data: { currenciesCount },
      } = await graphqlFetchAsNormalUser({
        query: /* GraphQL */ `
          query {
            currenciesCount
          }
        `,
        variables: {},
      });
      assert.strictEqual(currenciesCount, 3);
    });

    test('Return count of currencies filtered by queryString', async () => {
      const {
        data: { currenciesCount },
      } = await graphqlFetchAsNormalUser({
        query: /* GraphQL */ `
          query CurrenciesCount($queryString: String) {
            currenciesCount(queryString: $queryString)
          }
        `,
        variables: {
          queryString: 'EUR',
        },
      });
      assert.strictEqual(currenciesCount, 1);
    });
  });

  test.describe('Query.currenciesCount for anonymous user', () => {
    test('Return count of all active currencies', async () => {
      const {
        data: { currenciesCount },
      } = await graphqlFetchAsAnonymousUser({
        query: /* GraphQL */ `
          query {
            currenciesCount
          }
        `,
        variables: {},
      });
      assert.strictEqual(currenciesCount, 3);
    });

    test('Return count of currencies filtered by queryString', async () => {
      const {
        data: { currenciesCount },
      } = await graphqlFetchAsAnonymousUser({
        query: /* GraphQL */ `
          query CurrenciesCount($queryString: String) {
            currenciesCount(queryString: $queryString)
          }
        `,
        variables: {
          queryString: 'USD',
        },
      });
      assert.strictEqual(currenciesCount, 1);
    });
  });
});
