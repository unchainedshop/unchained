import { setupDatabase, createLoggedInGraphqlFetch } from './helpers.js';
import { ADMIN_TOKEN } from './seeds/users.js';
import { BaseCurrency } from './seeds/locale-data.js';
import assert from 'node:assert';
import test from 'node:test';

let graphqlFetch;

test.describe('Currency', () => {
  test.before(async () => {
    await setupDatabase();
    graphqlFetch = createLoggedInGraphqlFetch(ADMIN_TOKEN);
  });

  test.describe('For admin user ', () => {
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
});
