import test from 'node:test';
import assert from 'node:assert';
import {
  setupDatabase,
  createLoggedInGraphqlFetch,
  createAnonymousGraphqlFetch,
  disconnect,
} from './helpers.js';
import { ADMIN_TOKEN, USER_TOKEN } from './seeds/users.js';

let adminGraphqlFetch;
let anonymousGraphqlFetch;
let loggedInGraphqlFetch;

test.describe('Query: medias, mediasCount & media', async () => {
  test.before(async () => {
    await setupDatabase();
    adminGraphqlFetch = createLoggedInGraphqlFetch(ADMIN_TOKEN);
    anonymousGraphqlFetch = createAnonymousGraphqlFetch();
    loggedInGraphqlFetch = createLoggedInGraphqlFetch(USER_TOKEN);
  });

  test.after(async () => {
    await disconnect();
  });

  test.describe('Query.medias for admin user', async () => {
    test('returns a list of media objects', async () => {
      const { data } = await adminGraphqlFetch({
        query: /* GraphQL */ `
          query medias($limit: Int, $offset: Int) {
            medias(limit: $limit, offset: $offset) {
              _id
              name
              type
              size
              url
            }
          }
        `,
        variables: {
          limit: 10,
          offset: 0,
        },
      });
      assert.ok(Array.isArray(data.medias));
    });

    test('supports path filter', async () => {
      const { data } = await adminGraphqlFetch({
        query: /* GraphQL */ `
          query medias($path: String) {
            medias(path: $path) {
              _id
              name
            }
          }
        `,
        variables: {
          path: 'product-media',
        },
      });
      assert.ok(Array.isArray(data.medias));
    });

    test('supports types filter with prefix match', async () => {
      const { data } = await adminGraphqlFetch({
        query: /* GraphQL */ `
          query medias($types: [String!]) {
            medias(types: $types) {
              _id
              name
              type
            }
          }
        `,
        variables: {
          types: ['image'],
        },
      });
      assert.ok(Array.isArray(data.medias));
      for (const m of data.medias) {
        assert.ok(m.type.startsWith('image'), `Expected type to start with "image", got "${m.type}"`);
      }
    });

    test('supports multiple types filter', async () => {
      const { data } = await adminGraphqlFetch({
        query: /* GraphQL */ `
          query medias($types: [String!]) {
            medias(types: $types) {
              _id
              type
            }
          }
        `,
        variables: {
          types: ['image', 'application/pdf'],
        },
      });
      assert.ok(Array.isArray(data.medias));
      for (const m of data.medias) {
        assert.ok(
          m.type.startsWith('image') || m.type === 'application/pdf',
          `Expected image/* or application/pdf, got "${m.type}"`,
        );
      }
    });

    test('supports pagination', async () => {
      const { data: allData } = await adminGraphqlFetch({
        query: /* GraphQL */ `
          query medias {
            medias(limit: 100) {
              _id
            }
          }
        `,
      });

      const { data: limitedData } = await adminGraphqlFetch({
        query: /* GraphQL */ `
          query medias {
            medias(limit: 1) {
              _id
            }
          }
        `,
      });

      assert.ok(limitedData.medias.length <= 1);
      if (allData.medias.length > 1) {
        assert.ok(allData.medias.length > limitedData.medias.length);
      }
    });
  });

  test.describe('Query.mediasCount for admin user', async () => {
    test('returns the total number of media objects', async () => {
      const { data } = await adminGraphqlFetch({
        query: /* GraphQL */ `
          query mediasCount {
            mediasCount
          }
        `,
      });
      assert.strictEqual(typeof data.mediasCount, 'number');
      assert.ok(data.mediasCount >= 0);
    });

    test('supports path filter', async () => {
      const { data } = await adminGraphqlFetch({
        query: /* GraphQL */ `
          query mediasCount($path: String) {
            mediasCount(path: $path)
          }
        `,
        variables: {
          path: 'product-media',
        },
      });
      assert.strictEqual(typeof data.mediasCount, 'number');
    });
  });

  test.describe('Query.media for admin user', async () => {
    test('returns null for non-existent ID', async () => {
      const { data } = await adminGraphqlFetch({
        query: /* GraphQL */ `
          query media($mediaId: ID!) {
            media(mediaId: $mediaId) {
              _id
              name
              type
              size
              url
            }
          }
        `,
        variables: {
          mediaId: 'non-existent-id',
        },
      });
      assert.strictEqual(data.media, null);
    });

    test('returns a specific media object by ID', async () => {
      const {
        data: { medias },
      } = await adminGraphqlFetch({
        query: /* GraphQL */ `
          query medias {
            medias(limit: 1) {
              _id
            }
          }
        `,
      });

      if (medias.length > 0) {
        const { data } = await adminGraphqlFetch({
          query: /* GraphQL */ `
            query media($mediaId: ID!) {
              media(mediaId: $mediaId) {
                _id
                name
                type
                size
              }
            }
          `,
          variables: {
            mediaId: medias[0]._id,
          },
        });
        assert.strictEqual(data.media._id, medias[0]._id);
      }
    });
  });

  test.describe('Query.medias for anonymous user', async () => {
    test('returns error', async () => {
      const { errors } = await anonymousGraphqlFetch({
        query: /* GraphQL */ `
          query medias {
            medias {
              _id
            }
          }
        `,
      });
      assert.ok(errors.length > 0);
    });
  });

  test.describe('Query.mediasCount for anonymous user', async () => {
    test('returns error', async () => {
      const { errors } = await anonymousGraphqlFetch({
        query: /* GraphQL */ `
          query mediasCount {
            mediasCount
          }
        `,
      });
      assert.ok(errors.length > 0);
    });
  });

  test.describe('Query.media for anonymous user', async () => {
    test('returns error', async () => {
      const { errors } = await anonymousGraphqlFetch({
        query: /* GraphQL */ `
          query media($mediaId: ID!) {
            media(mediaId: $mediaId) {
              _id
            }
          }
        `,
        variables: {
          mediaId: 'some-id',
        },
      });
      assert.ok(errors.length > 0);
    });
  });
});
