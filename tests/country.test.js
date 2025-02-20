import { setupDatabase, createLoggedInGraphqlFetch, disconnect } from './helpers.js';
import { ADMIN_TOKEN } from './seeds/users.js';
import { BaseCountry } from './seeds/locale-data.js';
import assert from 'node:assert';
import test from 'node:test';

let graphqlFetch;

test.describe('Country', () => {
  test.before(async () => {
    await setupDatabase();
    graphqlFetch = createLoggedInGraphqlFetch(ADMIN_TOKEN);
  });

  test.after(async () => {
    await disconnect();
  });

  test.describe('For admin user ', () => {
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
});
