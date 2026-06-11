import {
  setupDatabase,
  createLoggedInGraphqlFetch,
  createAnonymousGraphqlFetch,
  disconnect,
} from './helpers.js';
import { ADMIN_TOKEN } from './seeds/users.js';
import assert from 'node:assert';
import test from 'node:test';

const GLOBAL_SEARCH_QUERY = /* GraphQL */ `
  query GlobalSearch($query: String!, $types: [SearchableEntity!], $limit: Int) {
    globalSearch(query: $query, types: $types, limit: $limit) {
      results {
        ... on SimpleProduct {
          _id
          __typename
        }
        ... on ConfigurableProduct {
          _id
          __typename
        }
        ... on User {
          _id
          __typename
        }
        ... on Order {
          _id
          __typename
        }
        ... on Assortment {
          _id
          __typename
        }
        ... on Filter {
          _id
          __typename
        }
      }
      counts {
        type
        totalCount
        authorized
      }
    }
  }
`;

let graphqlFetch;
let graphqlFetchAsAnonymousUser;

test.describe('Query.globalSearch', () => {
  test.before(async () => {
    await setupDatabase();
    graphqlFetch = createLoggedInGraphqlFetch(ADMIN_TOKEN);
    graphqlFetchAsAnonymousUser = createAnonymousGraphqlFetch();
  });

  test.after(async () => {
    await disconnect();
  });

  test.describe('Admin user', () => {
    test('return results and counts for a broad search', async () => {
      const {
        data: { globalSearch },
      } = await graphqlFetch({
        query: GLOBAL_SEARCH_QUERY,
        variables: { query: 'a', limit: 5 },
      });

      assert.ok(Array.isArray(globalSearch.results));
      assert.ok(Array.isArray(globalSearch.counts));
      assert.ok(globalSearch.counts.length > 0);

      for (const count of globalSearch.counts) {
        assert.ok(typeof count.type === 'string');
        assert.ok(typeof count.totalCount === 'number');
        assert.strictEqual(count.authorized, true);
      }
    });

    test('filter by specific type', async () => {
      const {
        data: { globalSearch },
      } = await graphqlFetch({
        query: GLOBAL_SEARCH_QUERY,
        variables: { query: 'a', types: ['PRODUCT'], limit: 5 },
      });

      assert.ok(Array.isArray(globalSearch.results));
      assert.strictEqual(globalSearch.counts.length, 1);
      assert.strictEqual(globalSearch.counts[0].type, 'PRODUCT');
    });

    test('return empty results for empty query', async () => {
      const {
        data: { globalSearch },
      } = await graphqlFetch({
        query: GLOBAL_SEARCH_QUERY,
        variables: { query: '' },
      });

      assert.deepStrictEqual(globalSearch.results, []);
      assert.deepStrictEqual(globalSearch.counts, []);
    });

    test('return empty results for whitespace-only query', async () => {
      const {
        data: { globalSearch },
      } = await graphqlFetch({
        query: GLOBAL_SEARCH_QUERY,
        variables: { query: '   ' },
      });

      assert.deepStrictEqual(globalSearch.results, []);
      assert.deepStrictEqual(globalSearch.counts, []);
    });
  });

  test.describe('Anonymous user', () => {
    test('return empty results with all types unauthorized', async () => {
      const {
        data: { globalSearch },
      } = await graphqlFetchAsAnonymousUser({
        query: GLOBAL_SEARCH_QUERY,
        variables: { query: 'test' },
      });

      assert.deepStrictEqual(globalSearch.results, []);
      assert.ok(globalSearch.counts.length > 0);
      for (const count of globalSearch.counts) {
        assert.strictEqual(count.authorized, false);
        assert.strictEqual(count.totalCount, 0);
      }
    });
  });
});
