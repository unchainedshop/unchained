import { setupDatabase, createLoggedInGraphqlFetch } from './helpers';
import { ADMIN_TOKEN, USER_TOKEN } from './seeds/users';
import { ConfigurableProduct } from './seeds/products';
import { SimpleBookmarks } from './seeds/bookmark';

let connection;
let graphqlFetch;
let graphqlNormalUserFetch;

describe('Bookmark', () => {
  beforeAll(async () => {
    [, connection] = await setupDatabase();
    graphqlFetch = await createLoggedInGraphqlFetch(ADMIN_TOKEN);
    graphqlNormalUserFetch = await createLoggedInGraphqlFetch(USER_TOKEN);
  });

  afterAll(async () => {
    await connection.close();
  });

  describe('For admin user ', () => {
    it('return array of all current user bookmarks should ', async () => {
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
                      meta
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
      expect(bookmarks.length).toEqual(2);
    });

    it('remove bookmark a product when provided valid product ID and false second argument', async () => {
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
      expect(bookmarks.length).toEqual(1);
    });

    it('bookmark a product when provided valid product ID', async () => {
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

      expect(bookmark).not.toBe(null);
    });

    it('remove bookmark when provided valid bookmark ID', async () => {
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
      expect(errors.length).toEqual(1);
    });
  });

  describe('For normal user ', () => {
    it('return array of all current user bookmarks should ', async () => {
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
      expect(bookmarks.length).toEqual(2);
    });

    it('remove bookmark a product when provided valid product ID and false second argument', async () => {
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
      expect(bookmarks.length).toEqual(1);
    });

    it('bookmark a product when provided valid product ID', async () => {
      const {
        data: { bookmark },
      } = await graphqlNormalUserFetch({
        query: /* GraphQL */ `
          mutation Bookmark($productId: ID!, $bookmarked: Boolean = true) {
            bookmark(productId: $productId, bookmarked: $bookmarked) {
              _id
            }
          }
        `,
        variables: {
          productId: ConfigurableProduct._id,
        },
      });

      expect(bookmark).not.toBe(null);
    });

    it('remove bookmark when provided valid bookmark ID', async () => {
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
          bookmarkId: SimpleBookmarks[2]._id,
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
      expect(errors.length).toEqual(1);
    });
  });
});
