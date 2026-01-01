import test from 'node:test';
import assert from 'node:assert';
import { setupDatabase, createJWTToken, disconnect } from './helpers.js';
import { ADMIN_TOKEN, USER_TOKEN } from './seeds/users.js';

let createLoggedInGraphqlFetch;
let createAnonymousGraphqlFetch;

let graphqlFetchAsAdmin;
let graphqlFetchAsUser;
let graphqlFetchAsAnonymous;

test.describe('User Removal', () => {
  test.before(async () => {
    ({ createLoggedInGraphqlFetch, createAnonymousGraphqlFetch } = await setupDatabase());
    graphqlFetchAsAdmin = createLoggedInGraphqlFetch(ADMIN_TOKEN);
    graphqlFetchAsUser = createLoggedInGraphqlFetch(USER_TOKEN);
    graphqlFetchAsAnonymous = createAnonymousGraphqlFetch();
  });

  test.after(async () => {
    await disconnect();
  });

  test.describe('Mutation.removeUser for admin user', () => {
    test('should remove a user', async () => {
      const {
        data: { createUser },
      } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          mutation CreateUser($username: String!, $email: String!, $password: String!) {
            createUser(username: $username, email: $email, password: $password) {
              _id
              user {
                _id
                username
              }
            }
          }
        `,
        variables: {
          username: 'testuser1',
          email: 'testuser1@example.com',
          password: 'password123',
        },
      });

      const userId = createUser.user._id;

      const {
        data: { removeUser },
      } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          mutation RemoveUser($userId: ID!) {
            removeUser(userId: $userId) {
              _id
              username
            }
          }
        `,
        variables: {
          userId,
        },
      });

      assert.ok(removeUser);
      assert.strictEqual(removeUser._id, userId);
    });

    test('should return error when removing non-existing user', async () => {
      const { errors } = await graphqlFetchAsAdmin({
        query: /* GraphQL */ `
          mutation RemoveUser($userId: ID!) {
            removeUser(userId: $userId) {
              _id
            }
          }
        `,
        variables: {
          userId: 'non-existing-user-id',
        },
      });

      assert.ok(errors);
      assert.strictEqual(errors[0]?.extensions?.code, 'UserNotFoundError');
    });

    test('Should remove user without removing its review', async () => {
      const username = 'userkeepreview';
      const password = 'password123';

      // Create a new user with a review, then remove the user but keep the review
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
          email: 'userkeepreview@example.com',
          password,
        },
      });

      assert.ok(createUser);
      const userId = createUser.user._id;

      // Create a JWT token to authenticate as the new user
      const graphqlFetchAsNewUser = createLoggedInGraphqlFetch(createJWTToken(userId));

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
          productId: 'simpleproduct',
          productReview: {
            rating: 5,
            title: 'Great Product - Keep Review',
            review: 'This review should remain after user removal',
          },
        },
      });

      assert.ok(createProductReview);
      const reviewId = createProductReview._id;

      // Remove the user WITHOUT removing their reviews (removeUserReviews: false)
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
      assert.strictEqual(removeUser._id, userId);

      // Verify the review still exists even after user deletion
      const {
        data: { productReview },
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

      assert.ok(productReview);
      assert.strictEqual(productReview._id, reviewId);
    });

    test('Should remove user and its review', async () => {
      const username = 'userwithreview';
      const password = 'password123';

      // Create a new user
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
          email: 'userwithreview@example.com',
          password,
        },
      });

      assert.ok(createUser);
      const userId = createUser.user._id;

      // Create a JWT token to authenticate as the new user
      const graphqlFetchAsNewUser = createLoggedInGraphqlFetch(createJWTToken(userId));

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
          productId: 'simpleproduct',
          productReview: {
            rating: 4,
            title: 'User Review to Remove',
            review: 'This review should be removed with user',
          },
        },
      });

      assert.ok(createProductReview);
      const reviewId = createProductReview._id;

      // Remove the user WITH removing their reviews (removeUserReviews: true)
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
          removeUserReviews: true,
        },
      });

      assert.ok(removeUser);
      assert.strictEqual(removeUser._id, userId);

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
  });

  test.describe('Mutation.removeUser for normal user', () => {
    test('should return NoPermissionError when removing another user', async () => {
      const { errors } = await graphqlFetchAsUser({
        query: /* GraphQL */ `
          mutation RemoveUser($userId: ID!) {
            removeUser(userId: $userId) {
              _id
            }
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

  test.describe('Mutation.removeUser for anonymous user', () => {
    test('should return NoPermissionError', async () => {
      const { errors } = await graphqlFetchAsAnonymous({
        query: /* GraphQL */ `
          mutation RemoveUser($userId: ID!) {
            removeUser(userId: $userId) {
              _id
            }
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
