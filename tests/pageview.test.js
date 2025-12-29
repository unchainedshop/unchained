import {
  setupDatabase,
  createLoggedInGraphqlFetch,
  createAnonymousGraphqlFetch,
  disconnect,
  getDrizzleDb,
} from './helpers.js';
import { USER_TOKEN } from './seeds/users.js';
import { events } from '@unchainedshop/core-events';
import { and, eq, desc, sql } from 'drizzle-orm';
import assert from 'node:assert';
import test from 'node:test';

let graphqlFetchAsUser;
let graphqlFetchAsAnonymous;
let drizzleDb;

test.describe('Mutation.pageView', () => {
  test.before(async () => {
    await setupDatabase();
    graphqlFetchAsUser = createLoggedInGraphqlFetch(USER_TOKEN);
    graphqlFetchAsAnonymous = createAnonymousGraphqlFetch();
    drizzleDb = getDrizzleDb();
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

      const [event] = await drizzleDb
        .select()
        .from(events)
        .where(
          and(
            eq(events.type, 'PAGE_VIEW'),
            sql`json_extract(${events.payload}, '$.path') = ${'/products/test-product'}`,
            sql`json_extract(${events.payload}, '$.referrer') = ${'/home'}`,
          ),
        )
        .orderBy(desc(events.created))
        .limit(1);

      assert.ok(event, 'Event should be stored in database');
      assert.strictEqual(event.type, 'PAGE_VIEW');
      assert.strictEqual(event.payload.path, '/products/test-product');
      assert.strictEqual(event.payload.referrer, '/home');
      assert.ok(event.created, 'Event should have a created timestamp');
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

      const [event] = await drizzleDb
        .select()
        .from(events)
        .where(
          and(
            eq(events.type, 'PAGE_VIEW'),
            sql`json_extract(${events.payload}, '$.path') = ${'/checkout'}`,
          ),
        )
        .orderBy(desc(events.created))
        .limit(1);

      assert.ok(event, 'Event should be stored in database');
      assert.strictEqual(event.type, 'PAGE_VIEW');
      assert.strictEqual(event.payload.path, '/checkout');
      assert.ok(event.created, 'Event should have a created timestamp');
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
      const [event] = await drizzleDb
        .select()
        .from(events)
        .where(
          and(
            eq(events.type, 'PAGE_VIEW'),
            sql`json_extract(${events.payload}, '$.path') = ${'/products/anonymous-view'}`,
            sql`json_extract(${events.payload}, '$.referrer') = ${'https://google.com'}`,
          ),
        )
        .orderBy(desc(events.created))
        .limit(1);

      assert.ok(event, 'Event should be stored in database');
      assert.strictEqual(event.type, 'PAGE_VIEW');
      assert.strictEqual(event.payload.path, '/products/anonymous-view');
      assert.strictEqual(event.payload.referrer, 'https://google.com');
      assert.ok(event.created, 'Event should have a created timestamp');
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

        const [event] = await drizzleDb
          .select()
          .from(events)
          .where(
            and(eq(events.type, 'PAGE_VIEW'), sql`json_extract(${events.payload}, '$.path') = ${path}`),
          )
          .orderBy(desc(events.created))
          .limit(1);

        assert.ok(event, `Event should be stored in database for path: ${path}`);
        assert.strictEqual(event.type, 'PAGE_VIEW');
        assert.strictEqual(event.payload.path, path);
        assert.ok(event.created, 'Event should have a created timestamp');
      }
    });
  });
});
