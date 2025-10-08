import test from 'node:test';
import assert from 'node:assert';
import {
  setupDatabase,
  createLoggedInGraphqlFetch,
  createAnonymousGraphqlFetch,
  disconnect,
} from './helpers.js';
import { ADMIN_TOKEN, User, USER_TOKEN } from './seeds/users.js';
import { SimpleProduct } from './seeds/products.js';

let graphqlFetchAsAdmin;
let graphqlFetchAsUser;
let graphqlFetchAsAnonymous;

test.describe('Remove User Product Reviews', () => {
  test.before(async () => {
    await setupDatabase();
    graphqlFetchAsAdmin = createLoggedInGraphqlFetch(ADMIN_TOKEN);
    graphqlFetchAsUser = createLoggedInGraphqlFetch(USER_TOKEN);
    graphqlFetchAsAnonymous = createAnonymousGraphqlFetch();
  });

  test.after(async () => {
    await disconnect();
  });

  test.describe('Mutation.removeUserProductReviews for admin user', () => {
    test('should remove all product reviews for a specific user', async () => {
      const { data: { createProductReview: review1 } = {} } = await graphqlFetchAsUser({
        query: /* GraphQL */ `
          mutation CreateProductReview($productId: ID!, $productReview: ProductReviewInput!) {
            createProductReview(productId: $productId, productReview: $productReview) {
              _id
              author {
                _id
              }
            }
          }
        `,
        variables: {
          productId: SimpleProduct._id,
          productReview: {
            rating: 5,
            title: 'Great Product',
            review: 'This is a great product',
          },
        },
      });

      const { data: { createProductReview: review2 } = {} } = await graphqlFetchAsUser({
        query: /* GraphQL */ `
          mutation CreateProductReview($productId: ID!, $productReview: ProductReviewInput!) {
            createProductReview(productId: $productId, productReview: $productReview) {
              _id
              author {
                _id
              }
            }
          }
        `,
        variables: {
          productId: SimpleProduct._id,
          productReview: {
            rating: 4,
            title: 'Good Product',
            review: 'This is a good product',
          },
        },
      });

      assert.ok(review1);
      assert.ok(review2);

      const {
        data: { removeUserProductReviews },
      } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          mutation RemoveUserProductReviews($userId: ID!) {
            removeUserProductReviews(userId: $userId)
          }
        `,
        variables: {
          userId: User._id,
        },
      });

      assert.strictEqual(removeUserProductReviews, true);

      const { errors } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          query ProductReview($productReviewId: ID!) {
            productReview(productReviewId: $productReviewId) {
              _id
            }
          }
        `,
        variables: {
          productReviewId: review1._id,
        },
      });

      assert.ok(errors);
      assert.strictEqual(errors[0]?.extensions?.code, 'ProductReviewNotFoundError');
    });

    test('should return true even if user has no reviews', async () => {
      const {
        data: { createUser },
      } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          mutation CreateUser($username: String!, $email: String!, $password: String!) {
            createUser(username: $username, email: $email, password: $password) {
              _id
              user {
                _id
              }
            }
          }
        `,
        variables: {
          username: 'noreviewuser',
          email: 'noreview@example.com',
          password: 'password123',
        },
      });

      const userId = createUser.user._id;

      const {
        data: { removeUserProductReviews },
      } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          mutation RemoveUserProductReviews($userId: ID!) {
            removeUserProductReviews(userId: $userId)
          }
        `,
        variables: {
          userId,
        },
      });

      assert.strictEqual(removeUserProductReviews, true);
    });

    test.todo('should be able to remove another user review even if the user is deleted');

    test('should allow admin to remove their own reviews', async () => {
      const { data: { createProductReview } = {} } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          mutation CreateProductReview($productId: ID!, $productReview: ProductReviewInput!) {
            createProductReview(productId: $productId, productReview: $productReview) {
              _id
              author {
                _id
              }
            }
          }
        `,
        variables: {
          productId: SimpleProduct._id,
          productReview: {
            rating: 5,
            title: 'Admin Review',
            review: 'Admin review content',
          },
        },
      });

      const adminUserId = createProductReview.author._id;

      const {
        data: { removeUserProductReviews },
      } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          mutation RemoveUserProductReviews($userId: ID!) {
            removeUserProductReviews(userId: $userId)
          }
        `,
        variables: {
          userId: adminUserId,
        },
      });

      assert.strictEqual(removeUserProductReviews, true);
    });
  });

  test.describe('Mutation.removeUserProductReviews for normal user', () => {
    test('should allow user to remove their own reviews', async () => {
      const { data: { createProductReview } = {} } = await graphqlFetchAsUser({
        query: /* GraphQL */ `
          mutation CreateProductReview($productId: ID!, $productReview: ProductReviewInput!) {
            createProductReview(productId: $productId, productReview: $productReview) {
              _id
              author {
                _id
              }
            }
          }
        `,
        variables: {
          productId: SimpleProduct._id,
          productReview: {
            rating: 4,
            title: 'User Review',
            review: 'User review content',
          },
        },
      });

      assert.ok(createProductReview);

      const {
        data: { removeUserProductReviews },
      } = await graphqlFetchAsUser({
        query: /* GraphQL */ `
          mutation RemoveUserProductReviews($userId: ID!) {
            removeUserProductReviews(userId: $userId)
          }
        `,
        variables: {
          userId: User._id,
        },
      });

      assert.strictEqual(removeUserProductReviews, true);
    });

    test('should return NoPermissionError when removing another users reviews', async () => {
      const { errors } = await graphqlFetchAsUser({
        query: /* GraphQL */ `
          mutation RemoveUserProductReviews($userId: ID!) {
            removeUserProductReviews(userId: $userId)
          }
        `,
        variables: {
          userId: 'admin',
        },
      });

      assert.ok(errors);
      assert.strictEqual(errors[0]?.extensions?.code, 'NoPermissionError');
    });
  });

  test.describe('Mutation.removeUserProductReviews for anonymous user', () => {
    test('should return NoPermissionError', async () => {
      const { errors } = await graphqlFetchAsAnonymous({
        query: /* GraphQL */ `
          mutation RemoveUserProductReviews($userId: ID!) {
            removeUserProductReviews(userId: $userId)
          }
        `,
        variables: {
          userId: 'user',
        },
      });

      assert.ok(errors);
      assert.strictEqual(errors[0]?.extensions?.code, 'NoPermissionError');
    });
  });
});
