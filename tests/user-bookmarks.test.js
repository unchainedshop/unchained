import { setupDatabase, createLoggedInGraphqlFetch } from './helpers';
import { SimpleProduct } from './seeds/products';
import { ADMIN_TOKEN, User } from './seeds/users';

let connection;
let db;  // eslint-disable-line
let graphqlFetch;

describe('User Bookmarks', () => {
  beforeAll(async () => {
    [db, connection] = await setupDatabase();
    graphqlFetch = await createLoggedInGraphqlFetch(ADMIN_TOKEN);
  });

  afterAll(async () => {
    await connection.close();
  });

  describe('Mutation.createBookmark', () => {
    it('create a new bookmark for a specific user', async () => {
      const { data: { createBookmark } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation createBookmark($productId: ID!, $userId: ID) {
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
          productId: SimpleProduct._id,
          userId: User._id
        }
      });
      expect(createBookmark).toMatchObject({
        user: {
          _id: User._id
        }
      });
    });
  });

  describe('Mutation.removeBookmark', () => {
    it('remove a product review', async () => {
      const { data: { removeBookmark } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation removeBookmark($bookmarkId: ID!) {
            removeBookmark(bookmarkId: $bookmarkId) {
              _id
            }
          }
        `,
        variables: {
          bookmarkId: SimpleBookmark._id
        }
      });
      expect(removeBookmark.deleted).toBeTruthy();
    });
  });
  describe('User.bookmarks', () => {
    it('returns 1 bookmark', async () => {
      const { data: { user: { bookmarks } } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          query bookmarks($userId: ID!) {
            user(userId: $userId) {
              _id
              bookmarks {
                rating
                title
              }
            }
          }
        `,
        variables: {
          userId: SimpleProduct._id
        }
      });
      expect(bookmarks).toMatchObject([
        {
          title: 'Hello',
          rating: 5
        }
      ]);
    });
  });
});
