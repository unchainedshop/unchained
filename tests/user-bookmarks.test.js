import { setupDatabase, createLoggedInGraphqlFetch } from './helpers.js';
import { UnpublishedProduct, SimpleProduct, PlanProduct } from './seeds/products.js';
import { ADMIN_TOKEN, User, Admin } from './seeds/users.js';

let db;
let graphqlFetch;

describe('User Bookmarks', () => {
  beforeAll(async () => {
    [db] = await setupDatabase();
    graphqlFetch = await createLoggedInGraphqlFetch(ADMIN_TOKEN);
  });

  describe('Mutation.createBookmark', () => {
    it('create a new bookmark for a specific user', async () => {
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
      expect(createBookmark).toMatchObject({
        user: {
          _id: User._id,
        },
        product: {
          _id: UnpublishedProduct._id,
        },
      });
    });

    it('return not found error when passed non existing productId ', async () => {
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
      expect(errors[0]?.extensions?.code).toEqual('ProductNotFoundError');
    });

    it('return error when passed invalid productId ', async () => {
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
      expect(errors[0]?.extensions?.code).toEqual('InvalidIdError');
    });
  });

  describe('Mutation.removeBookmark', () => {
    it('remove a bookmark', async () => {
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
      expect(errors[0].extensions?.code).toEqual('BookmarkNotFoundError');
    });

    it('return not found error when passed non existin bookmarkId', async () => {
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
      expect(errors[0]?.extensions?.code).toEqual('BookmarkNotFoundError');
    });

    it('return error when passed invalid bookmarkId', async () => {
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
      expect(errors[0]?.extensions?.code).toEqual('InvalidIdError');
    });
  });

  describe('Mutation.bookmark', () => {
    it('create a new bookmark for logged in user', async () => {
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
      expect(bookmark).toMatchObject({
        user: {
          _id: Admin._id,
        },
        product: {
          _id: SimpleProduct._id,
        },
      });
    });

    it('return not found error when passed non existing productId', async () => {
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
      expect(errors[0]?.extensions?.code).toEqual('ProductNotFoundError');
    });

    it('return error when passed invalid productId', async () => {
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
      expect(errors[0]?.extensions?.code).toEqual('InvalidIdError');
    });
  });

  describe('User.bookmarks', () => {
    it('returns 2 bookmarks', async () => {
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
      expect(bookmarks.length).toEqual(2);
      expect(bookmarks).toMatchObject([
        { product: { _id: SimpleProduct._id } },
        { product: { _id: PlanProduct._id } },
      ]);
    });
  });
});
