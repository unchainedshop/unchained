import { setupDatabase, createLoggedInGraphqlFetch, disconnect } from './helpers.js';
import { ADMIN_TOKEN } from './seeds/users.js';
import { BaseLanguage } from './seeds/locale-data.js';
import assert from 'node:assert';
import test from 'node:test';

let graphqlFetch;

test.describe('Language', () => {
  test.before(async () => {
    await setupDatabase();
    graphqlFetch = createLoggedInGraphqlFetch(ADMIN_TOKEN);
  });

  test.after(async () => {
    await disconnect();
  });

  test('Return language search result', async () => {
    const {
      data: { languages },
    } = await graphqlFetch({
      query: /* GraphQL */ `
        query Languages($queryString: String) {
          languages(queryString: $queryString) {
            _id
            isoCode
          }
        }
      `,
      variables: {
        queryString: 'de',
      },
    });
    assert.strictEqual(languages.length, 1);
    assert.deepStrictEqual(languages, [
      {
        _id: BaseLanguage._id,
        isoCode: BaseLanguage.isoCode,
      },
    ]);
  });

  test('Return empty array when no matching search result found', async () => {
    const {
      data: { languages },
    } = await graphqlFetch({
      query: /* GraphQL */ `
        query Languages($queryString: String) {
          languages(queryString: $queryString) {
            _id
            isoCode
          }
        }
      `,
      variables: {
        queryString: 'wrong',
      },
    });
    assert.strictEqual(languages.length, 0);
  });
});
