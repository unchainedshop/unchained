import {
  setupDatabase,
  createLoggedInGraphqlFetch,
  createAnonymousGraphqlFetch,
  disconnect,
} from './helpers.js';
import { ADMIN_TOKEN, USER_TOKEN } from './seeds/users.js';
import assert from 'node:assert';
import test from 'node:test';

const GLOBAL_SEARCH_QUERY = /* GraphQL */ `
  query GlobalSearch(
    $query: String!
    $types: [SearchableEntity!]
    $limit: Int
    $typeLimits: [GlobalSearchTypeLimitInput!]
    $includeDraftProducts: Boolean
  ) {
    globalSearch(
      query: $query
      types: $types
      limit: $limit
      typeLimits: $typeLimits
      includeDraftProducts: $includeDraftProducts
    ) {
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
let graphqlFetchAsNormalUser;
let graphqlFetchAsAnonymousUser;

test.describe('Query.globalSearch', () => {
  test.before(async () => {
    await setupDatabase();
    graphqlFetch = createLoggedInGraphqlFetch(ADMIN_TOKEN);
    graphqlFetchAsNormalUser = createLoggedInGraphqlFetch(USER_TOKEN);
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

    test('clamp limits and deduplicate requested types', async () => {
      const {
        data: { globalSearch },
      } = await graphqlFetch({
        query: GLOBAL_SEARCH_QUERY,
        variables: {
          query: 'simple',
          types: ['PRODUCT', 'PRODUCT'],
          limit: 10,
          typeLimits: [{ type: 'PRODUCT', limit: 0 }],
        },
      });

      assert.strictEqual(globalSearch.results.length, 1);
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

  test.describe('Limited non-admin user', () => {
    test('can search only the published products allowed by the effective arguments', async () => {
      const { data, errors } = await graphqlFetchAsNormalUser({
        query: GLOBAL_SEARCH_QUERY,
        variables: {
          query: 'simple',
          types: ['PRODUCT'],
          includeDraftProducts: false,
        },
      });

      assert.strictEqual(errors, undefined);
      assert.ok(data.globalSearch.results.length > 0);
      assert.deepStrictEqual(data.globalSearch.counts, [
        {
          type: 'PRODUCT',
          totalCount: data.globalSearch.counts[0].totalCount,
          authorized: true,
        },
      ]);
    });

    test('rejects the whole query when any requested type is unauthorized', async () => {
      const { data, errors } = await graphqlFetchAsNormalUser({
        query: GLOBAL_SEARCH_QUERY,
        variables: {
          query: 'simple',
          types: ['PRODUCT', 'ORDER'],
          includeDraftProducts: false,
        },
      });

      assert.strictEqual(data, null);
      assert.strictEqual(errors?.[0]?.extensions?.code, 'NoPermissionError');
    });
  });

  test.describe('Anonymous user', () => {
    test('return NoPermissionError', async () => {
      const { errors } = await graphqlFetchAsAnonymousUser({
        query: GLOBAL_SEARCH_QUERY,
        variables: { query: 'test' },
      });

      assert.strictEqual(errors?.[0]?.extensions?.code, 'NoPermissionError');
    });

    test('return NoPermissionError for an empty query', async () => {
      const { errors } = await graphqlFetchAsAnonymousUser({
        query: GLOBAL_SEARCH_QUERY,
        variables: { query: '', types: ['PRODUCT'] },
      });

      assert.strictEqual(errors?.[0]?.extensions?.code, 'NoPermissionError');
    });
  });
});
