import { setupDatabase, createLoggedInGraphqlFetch, createAnonymousGraphqlFetch } from './helpers.js';
import { Admin, ADMIN_TOKEN, USER_TOKEN } from './seeds/users.js';
import { ConfigurableProduct } from './seeds/products.js';
import { SimpleBookmarks } from './seeds/bookmark.js';
import assert from 'node:assert';
import test from 'node:test';

let graphqlFetch;
let graphqlNormalUserFetch;
let graphqlAnonymousUserFetch;

test.describe('Bookmark', () => {
  test.before(async () => {
    await setupDatabase();
    graphqlFetch = createLoggedInGraphqlFetch(ADMIN_TOKEN);
    graphqlNormalUserFetch = createLoggedInGraphqlFetch(USER_TOKEN);
    graphqlAnonymousUserFetch = createAnonymousGraphqlFetch();
  });

  test.describe('For admin user ', () => {
    test('return array of all current user bookmarks should ', async () => {
      const {
        data: {
          user: { bookmarks },
        },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query userBookmarks {
            user {
              bookmarks {
                _id
                created
                product {
                  _id
                  sequence
                  status
                  tags
                  created
                  updated
                  published
                  texts {
                    _id
                    locale
                    title
                    slug
                    subtitle
                    description
                    brand
                    labels
                  }
                  media {
                    _id
                    tags
                    file {
                      _id
                      name
                      type
                      size
                      url
                    }
                    sortKey
                    texts {
                      _id
                      locale
                      title
                      subtitle
                    }
                  }
                }
              }
            }
          }
        `,
        variables: {},
      });
      assert.strictEqual(bookmarks.length, 2);
    });

    test('remove bookmark a product when provided valid product ID and false second argument', async () => {
      const {
        data: { bookmark }, // eslint-disable-line
      } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation Bookmark($productId: ID!, $bookmarked: Boolean = true) {
            bookmark(productId: $productId, bookmarked: $bookmarked) {
              _id
              user {
                _id
                username
                isGuest
                isInitialPassword
              }
              product {
                _id
                sequence
                status
                tags
                created
                updated
                published
                texts {
                  _id
                  locale
                  slug
                  title
                  subtitle
                  description
                  vendor
                  brand
                  labels
                }
              }
              created
            }
          }
        `,
        variables: {
          productId: 'simpleproduct',
          bookmarked: false,
        },
      });
      assert.deepStrictEqual(bookmark, {
        user: {
          _id: Admin._id,
        },
        product: {
          _id: 'simpleproduct',
        },
      });

      const {
        data: {
          user: { bookmarks },
        },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query userBookmarks {
            user {
              bookmarks {
                _id
              }
            }
          }
        `,
        variables: {},
      });
      assert.strictEqual(bookmarks.length, 1);
    });

    test('bookmark a product when provided valid product ID', async () => {
      const {
        data: { bookmark },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation Bookmark($productId: ID!, $bookmarked: Boolean = true) {
            bookmark(productId: $productId, bookmarked: $bookmarked) {
              _id
              user {
                _id
                username
                isGuest
                isInitialPassword
              }
              product {
                _id
                sequence
                status
                tags
                created
                updated
                published
                texts {
                  _id
                  locale
                  slug
                  title
                  subtitle
                  description
                  vendor
                  brand
                  labels
                }
              }
              created
            }
          }
        `,
        variables: {
          productId: ConfigurableProduct._id,
        },
      });

      assert.notStrictEqual(bookmark, null);
      const {
        data: {
          user: { bookmarks },
        },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query userBookmarks {
            user {
              bookmarks {
                _id
              }
            }
          }
        `,
        variables: {},
      });
      assert.strictEqual(bookmarks.length, 2);
    });

    test('remove bookmark when provided valid bookmark ID', async () => {
      const {
        data: { removeBookmark }, // eslint-disable-line
      } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation RemoveBookmark($bookmarkId: ID!) {
            removeBookmark(bookmarkId: $bookmarkId) {
              _id
              user {
                _id
                username
                isGuest
                isInitialPassword
              }
              product {
                _id
                sequence
                status
                tags
                created
                updated
                published
                texts {
                  _id
                  locale
                  slug
                  title
                  subtitle
                  description
                  vendor
                  brand
                  labels
                }
              }
              created
            }
          }
        `,
        variables: {
          bookmarkId: SimpleBookmarks[3]._id,
        },
      });

      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation RemoveBookmark($bookmarkId: ID!) {
            removeBookmark(bookmarkId: $bookmarkId) {
              _id
            }
          }
        `,
        variables: {
          bookmarkId: SimpleBookmarks[3]._id,
        },
      });
      assert.strictEqual(errors[0].extensions.code, 'BookmarkNotFoundError');
    });
  });

  test.describe('For normal user ', () => {
    test('return array of all current user bookmarks should ', async () => {
      const {
        data: {
          user: { bookmarks },
        },
      } = await graphqlNormalUserFetch({
        query: /* GraphQL */ `
          query userBookmarks {
            user {
              bookmarks {
                _id
              }
            }
          }
        `,
        variables: {},
      });
      assert.strictEqual(bookmarks.length, 2);
    });

    test('remove bookmark a product when provided valid product ID and false second argument', async () => {
      const {
        data: { bookmark }, // eslint-disable-line
      } = await graphqlNormalUserFetch({
        query: /* GraphQL */ `
          mutation Bookmark($productId: ID!, $bookmarked: Boolean = true) {
            bookmark(productId: $productId, bookmarked: $bookmarked) {
              _id
            }
          }
        `,
        variables: {
          productId: 'simpleproduct',
          bookmarked: false,
        },
      });

      const {
        data: {
          user: { bookmarks },
        },
      } = await graphqlNormalUserFetch({
        query: /* GraphQL */ `
          query userBookmarks {
            user {
              bookmarks {
                _id
              }
            }
          }
        `,
        variables: {},
      });
      assert.strictEqual(bookmarks.length, 1);
    });

    test('bookmark a product when provided valid product ID', async () => {
      const {
        data: { bookmark },
      } = await graphqlNormalUserFetch({
        query: /* GraphQL */ `
          mutation Bookmark($productId: ID!, $bookmarked: Boolean = true) {
            bookmark(productId: $productId, bookmarked: $bookmarked) {
              _id
              product {
                _id
              }
            }
          }
        `,
        variables: {
          productId: ConfigurableProduct._id,
        },
      });
      assert.strictEqual(bookmark.product._id, ConfigurableProduct._id);
    });

    test('remove bookmark when provided valid bookmark ID', async () => {
      const {
        data: { removeBookmark }, // eslint-disable-line
      } = await graphqlNormalUserFetch({
        query: /* GraphQL */ `
          mutation RemoveBookmark($bookmarkId: ID!) {
            removeBookmark(bookmarkId: $bookmarkId) {
              _id
            }
          }
        `,
        variables: {
          bookmarkId: SimpleBookmarks[1]._id,
        },
      });

      const { errors } = await graphqlNormalUserFetch({
        query: /* GraphQL */ `
          mutation RemoveBookmark($bookmarkId: ID!) {
            removeBookmark(bookmarkId: $bookmarkId) {
              _id
            }
          }
        `,
        variables: {
          bookmarkId: SimpleBookmarks[3]._id,
        },
      });
      assert.strictEqual(errors[0].extensions.code, 'BookmarkNotFoundError');
    });
  });

  test.describe('For anonymous user ', () => {
    test('bookmarking is not possible', async () => {
      await assert.rejects(async () => {
        const {
          data: { bookmark, error }, // eslint-disable-line
        } = await graphqlAnonymousUserFetch({
          query: /* GraphQL */ `
            mutation Bookmark($productId: ID!, $bookmarked: Boolean = true) {
              bookmark(productId: $productId, bookmarked: $bookmarked) {
                _id
              }
            }
          `,
          variables: {
            productId: 'simpleproduct',
            bookmarked: false,
          },
        });
      });
    });
  });
});
