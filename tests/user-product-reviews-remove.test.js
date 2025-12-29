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
let db;

test.describe('Remove User Product Reviews', () => {
  test.before(async () => {
    [db] = await setupDatabase();
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

    test('should be able to remove another user review even if the user is deleted', async () => {
      const username = 'deletedreviewuser2';
      const password = 'password123';

      // Create a new user with a review
      const {
        data: { createUser },
      } = await graphqlFetchAsAnonymous({
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
          username,
          email: 'deletedreviewuser2@example.com',
          password,
        },
      });

      assert.ok(createUser);
      const userId = createUser.user._id;

      // Set a known token secret for the new user so we can authenticate as them
      const plainSecret = 'testsecret';
      const crypto = await import('node:crypto');
      const hashedSecret = crypto
        .createHash('sha256')
        .update(`${username}:${plainSecret}`)
        .digest('hex');
      await db
        .collection('users')
        .updateOne({ _id: userId }, { $set: { 'services.token': { secret: hashedSecret } } });
      const graphqlFetchAsNewUser = createLoggedInGraphqlFetch(`Bearer ${username}:${plainSecret}`);

      // Create a product review as the new user
      const {
        data: { createProductReview },
      } = await graphqlFetchAsNewUser({
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
            rating: 3,
            title: 'Deleted User Review',
            review: 'This review was created by a user who will be deleted',
          },
        },
      });

      assert.ok(createProductReview);
      const reviewId = createProductReview._id;

      // Remove the user WITHOUT removing their reviews
      const {
        data: { removeUser },
      } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          mutation RemoveUser($userId: ID!, $removeUserReviews: Boolean) {
            removeUser(userId: $userId, removeUserReviews: $removeUserReviews) {
              _id
            }
          }
        `,
        variables: {
          userId,
          removeUserReviews: false,
        },
      });

      assert.ok(removeUser);

      // Verify the review still exists after user deletion
      const {
        data: { productReview: reviewBeforeCleanup },
      } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          query ProductReview($productReviewId: ID!) {
            productReview(productReviewId: $productReviewId) {
              _id
            }
          }
        `,
        variables: {
          productReviewId: reviewId,
        },
      });

      assert.ok(
        reviewBeforeCleanup,
        'Review should still exist after user deletion with removeUserReviews: false',
      );

      // Now admin should be able to remove the deleted user's reviews
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

      // Verify the review no longer exists
      const { errors } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          query ProductReview($productReviewId: ID!) {
            productReview(productReviewId: $productReviewId) {
              _id
            }
          }
        `,
        variables: {
          productReviewId: reviewId,
        },
      });

      assert.ok(errors);
      assert.strictEqual(errors[0]?.extensions?.code, 'ProductReviewNotFoundError');
    });

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
