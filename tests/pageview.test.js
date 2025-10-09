import {
  setupDatabase,
  createLoggedInGraphqlFetch,
  createAnonymousGraphqlFetch,
  disconnect,
} from './helpers.js';
import { USER_TOKEN } from './seeds/users.js';
import assert from 'node:assert';
import test from 'node:test';

let graphqlFetchAsUser;
let graphqlFetchAsAnonymous;

test.describe('Mutation.pageView', () => {
  test.before(async () => {
    await setupDatabase();
    graphqlFetchAsUser = createLoggedInGraphqlFetch(USER_TOKEN);
    graphqlFetchAsAnonymous = createAnonymousGraphqlFetch();
  });

  test.after(async () => {
    await disconnect();
  });

  test.describe('pageView for logged in user', () => {
    test('should track page view with path and referrer', async () => {
      const { data } = await graphqlFetchAsUser({
        query: /* GraphQL */ `
          mutation PageView($path: String!, $referrer: String) {
            pageView(path: $path, referrer: $referrer)
          }
        `,
        variables: {
          path: '/products/test-product',
          referrer: '/home',
        },
      });

      assert.ok(data);
      assert.strictEqual(data.pageView, '/products/test-product');
    });

    test('should track page view without referrer', async () => {
      const { data } = await graphqlFetchAsUser({
        query: /* GraphQL */ `
          mutation PageView($path: String!) {
            pageView(path: $path)
          }
        `,
        variables: {
          path: '/checkout',
        },
      });

      assert.ok(data);
      assert.strictEqual(data.pageView, '/checkout');
    });
  });

  test.describe('pageView for anonymous user', () => {
    test('should track page view for anonymous users', async () => {
      const { data } = await graphqlFetchAsAnonymous({
        query: /* GraphQL */ `
          mutation PageView($path: String!, $referrer: String) {
            pageView(path: $path, referrer: $referrer)
          }
        `,
        variables: {
          path: '/products/anonymous-view',
          referrer: 'https://google.com',
        },
      });

      assert.ok(data);
      assert.strictEqual(data.pageView, '/products/anonymous-view');
    });

    test('should handle various path formats', async () => {
      const testPaths = ['/', '/products', '/cart/checkout', '/user/profile?tab=settings'];

      for (const path of testPaths) {
        const { data } = await graphqlFetchAsAnonymous({
          query: /* GraphQL */ `
            mutation PageView($path: String!) {
              pageView(path: $path)
            }
          `,
          variables: {
            path,
          },
        });

        assert.ok(data);
        assert.strictEqual(data.pageView, path);
      }
    });
  });
});
