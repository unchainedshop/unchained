import { setupDatabase, createLoggedInGraphqlFetch } from './helpers.js';
import { UnpublishedProduct, SimpleProduct, PlanProduct } from './seeds/products.js';
import { ADMIN_TOKEN, User, Admin } from './seeds/users.js';
import assert from 'node:assert';
import test from 'node:test';

let db;
let graphqlFetch;

test.describe('User Bookmarks', () => {
  test.before(async () => {
    [db] = await setupDatabase();
    graphqlFetch = createLoggedInGraphqlFetch(ADMIN_TOKEN);
  });

  test.describe('Mutation.createBookmark', () => {
    test('create a new bookmark for a specific user', async () => {
      const { data: { createBookmark } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation createBookmark($productId: ID!, $userId: ID!) {
            createBookmark(productId: $productId, userId: $userId) {
              _id
              created
              user {
                _id
              }
              product {
                _id
              }
            }
          }
        `,
        variables: {
          productId: UnpublishedProduct._id,
          userId: User._id,
        },
      });
      assert.deepStrictEqual(createBookmark, {
        user: {
          _id: User._id,
        },
        product: {
          _id: UnpublishedProduct._id,
        },
      });
    });

    test('return not found error when passed non existing productId', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation createBookmark($productId: ID!, $userId: ID!) {
            createBookmark(productId: $productId, userId: $userId) {
              _id
              created
              user {
                _id
              }
            }
          }
        `,
        variables: {
          productId: 'non-existing-id',
          userId: User._id,
        },
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'ProductNotFoundError');
    });

    test('return error when passed invalid productId', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation createBookmark($productId: ID!, $userId: ID!) {
            createBookmark(productId: $productId, userId: $userId) {
              _id
              created
              user {
                _id
              }
            }
          }
        `,
        variables: {
          productId: '',
          userId: User._id,
        },
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'InvalidIdError');
    });
  });

  test.describe('Mutation.removeBookmark', () => {
    test('remove a bookmark', async () => {
      const Bookmarks = db.collection('bookmarks');
      const bookmark = await Bookmarks.findOne({ userId: User._id });
      await graphqlFetch({
        query: /* GraphQL */ `
          mutation removeBookmark($bookmarkId: ID!) {
            removeBookmark(bookmarkId: $bookmarkId) {
              _id
            }
          }
        `,
        variables: {
          bookmarkId: bookmark._id,
        },
      });

      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation removeBookmark($bookmarkId: ID!) {
            removeBookmark(bookmarkId: $bookmarkId) {
              _id
            }
          }
        `,
        variables: {
          bookmarkId: bookmark._id,
        },
      });
      assert.strictEqual(errors[0].extensions?.code, 'BookmarkNotFoundError');
    });

    test('return not found error when passed non existing bookmarkId', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation removeBookmark($bookmarkId: ID!) {
            removeBookmark(bookmarkId: $bookmarkId) {
              _id
            }
          }
        `,
        variables: {
          bookmarkId: 'non-existing-id',
        },
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'BookmarkNotFoundError');
    });

    test('return error when passed invalid bookmarkId', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation removeBookmark($bookmarkId: ID!) {
            removeBookmark(bookmarkId: $bookmarkId) {
              _id
            }
          }
        `,
        variables: {
          bookmarkId: '',
        },
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'InvalidIdError');
    });
  });

  test.describe('Mutation.bookmark', () => {
    test('create a new bookmark for logged in user', async () => {
      const { data: { bookmark } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation bookmark($productId: ID!, $bookmarked: Boolean) {
            bookmark(productId: $productId, bookmarked: $bookmarked) {
              _id
              created
              user {
                _id
              }
              product {
                _id
              }
            }
          }
        `,
        variables: {
          productId: SimpleProduct._id,
          bookmarked: true,
        },
      });
      assert.deepStrictEqual(bookmark, {
        user: {
          _id: Admin._id,
        },
        product: {
          _id: SimpleProduct._id,
        },
      });
    });

    test('return not found error when passed non existing productId', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation bookmark($productId: ID!, $bookmarked: Boolean) {
            bookmark(productId: $productId, bookmarked: $bookmarked) {
              _id
            }
          }
        `,
        variables: {
          productId: 'non-existing-id',
          bookmarked: true,
        },
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'ProductNotFoundError');
    });

    test('return error when passed invalid productId', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation bookmark($productId: ID!, $bookmarked: Boolean) {
            bookmark(productId: $productId, bookmarked: $bookmarked) {
              _id
            }
          }
        `,
        variables: {
          productId: '',
          bookmarked: true,
        },
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'InvalidIdError');
    });
  });

  test.describe('User.bookmarks', () => {
    test('returns 2 bookmarks', async () => {
      const { data: { user: { bookmarks } } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          query bookmarks($userId: ID!) {
            user(userId: $userId) {
              _id
              bookmarks {
                product {
                  _id
                }
              }
            }
          }
        `,
        variables: {
          userId: Admin._id,
        },
      });
      assert.strictEqual(bookmarks.length, 2);
      assert.deepStrictEqual(bookmarks, [
        { product: { _id: SimpleProduct._id } },
        { product: { _id: PlanProduct._id } },
      ]);
    });
  });
});
