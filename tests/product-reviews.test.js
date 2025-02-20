import test from 'node:test';
import assert from 'node:assert';
import {
  setupDatabase,
  createLoggedInGraphqlFetch,
  createAnonymousGraphqlFetch,
  disconnect,
} from './helpers.js';
import { SimpleProduct, SimpleProductReview } from './seeds/products.js';
import { ADMIN_TOKEN, USER_TOKEN } from './seeds/users.js';

let graphqlFetch;
let graphqlFetchAsNormalUser;
let graphqlFetchAsAnonymusUser;

test.describe('Products: Reviews', async () => {
  test.before(async () => {
    await setupDatabase();
    graphqlFetch = createLoggedInGraphqlFetch(ADMIN_TOKEN);
    graphqlFetchAsNormalUser = createLoggedInGraphqlFetch(USER_TOKEN);
    graphqlFetchAsAnonymusUser = createAnonymousGraphqlFetch();
  });

  test.after(async () => {
    await disconnect();
  });

  test.describe('Mutation.createProductReview', async () => {
    test('create a new product review', async () => {
      const { data: { createProductReview } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation createProductReview($productId: ID!, $productReview: ProductReviewInput!) {
            createProductReview(productId: $productId, productReview: $productReview) {
              _id
              created
              updated
              author {
                username
              }
              product {
                _id
              }
              rating
              title
              review
              upvotes: voteCount(type: UPVOTE)
              downvotes: voteCount(type: DOWNVOTE)
              reports: voteCount(type: REPORT)
              ownVotes {
                _id
                timestamp
                type
              }
            }
          }
        `,
        variables: {
          productId: SimpleProduct._id,
          productReview: {
            rating: 5,
            title: 'Hello',
            review: 'World',
          },
        },
      });
      assert.partialDeepStrictEqual(createProductReview, {
        author: { username: 'admin' },
        product: { _id: SimpleProduct._id },
        rating: 5,
        title: 'Hello',
        review: 'World',
        upvotes: 0,
        downvotes: 0,
        reports: 0,
        ownVotes: [],
      });
    });

    test('return not found error when passed non existing productId', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation createProductReview($productId: ID!, $productReview: ProductReviewInput!) {
            createProductReview(productId: $productId, productReview: $productReview) {
              _id
            }
          }
        `,
        variables: {
          productId: 'invalid-product-id',
          productReview: {
            rating: 5,
            title: 'Hello',
            review: 'World',
          },
        },
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'ProductNotFoundError');
    });

    test('return error when passed invalid productId', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation createProductReview($productId: ID!, $productReview: ProductReviewInput!) {
            createProductReview(productId: $productId, productReview: $productReview) {
              _id
            }
          }
        `,
        variables: {
          productId: '',
          productReview: {
            rating: 5,
            title: 'Hello',
            review: 'World',
          },
        },
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'InvalidIdError');
    });
  });

  test.describe('Mutation.updateProductReview', async () => {
    test('update a product review', async () => {
      const { data: { updateProductReview } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation updateProductReview($productReviewId: ID!, $productReview: ProductReviewInput!) {
            updateProductReview(productReviewId: $productReviewId, productReview: $productReview) {
              _id
              created
              updated
              author {
                _id
              }
              product {
                _id
              }
              rating
              title
              review
              upvotes: voteCount(type: UPVOTE)
              downvotes: voteCount(type: DOWNVOTE)
              reports: voteCount(type: REPORT)
              ownVotes {
                _id
                timestamp
                type
              }
            }
          }
        `,
        variables: {
          productReviewId: SimpleProductReview._id,
          productReview: {
            rating: 1,
            review: 'World2',
          },
        },
      });
      assert.partialDeepStrictEqual(updateProductReview, {
        author: {
          _id: SimpleProductReview.authorId,
        },
        product: {
          _id: SimpleProduct._id,
        },
        rating: 1,
        title: SimpleProductReview.title,
        review: 'World2',
        upvotes: 0,
        downvotes: 0,
        reports: 0,
        ownVotes: [],
      });
    });

    test('return not found error when passed non existing productReviewId', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation updateProductReview($productReviewId: ID!, $productReview: ProductReviewInput!) {
            updateProductReview(productReviewId: $productReviewId, productReview: $productReview) {
              _id
            }
          }
        `,
        variables: {
          productReviewId: 'non-existing-id',
          productReview: {
            rating: 1,
            review: 'World2',
          },
        },
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'ProductReviewNotFoundError');
    });

    test('return error when passed invalid productReviewId', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation updateProductReview($productReviewId: ID!, $productReview: ProductReviewInput!) {
            updateProductReview(productReviewId: $productReviewId, productReview: $productReview) {
              _id
            }
          }
        `,
        variables: {
          productReviewId: '',
          productReview: {
            rating: 1,
            review: 'World2',
          },
        },
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'InvalidIdError');
    });
  });

  test.describe('Mutation.addProductReviewVote', async () => {
    test('upvote a review', async () => {
      const { data: { addProductReviewVote } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation addProductReviewVote(
            $productReviewId: ID!
            $type: ProductReviewVoteType!
            $meta: JSON
          ) {
            addProductReviewVote(productReviewId: $productReviewId, type: $type, meta: $meta) {
              _id
              upvotes: voteCount(type: UPVOTE)
              downvotes: voteCount(type: DOWNVOTE)
              ownVotes {
                type
              }
            }
          }
        `,
        variables: {
          productReviewId: SimpleProductReview._id,
          type: 'UPVOTE',
        },
      });
      assert.partialDeepStrictEqual(addProductReviewVote, {
        upvotes: 1,
        downvotes: 0,
        ownVotes: [
          {
            type: 'UPVOTE',
          },
        ],
      });
    });

    test('downvote same review', async () => {
      const { data: { addProductReviewVote } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation addProductReviewVote(
            $productReviewId: ID!
            $type: ProductReviewVoteType!
            $meta: JSON
          ) {
            addProductReviewVote(productReviewId: $productReviewId, type: $type, meta: $meta) {
              _id
              upvotes: voteCount(type: UPVOTE)
              downvotes: voteCount(type: DOWNVOTE)
              ownVotes {
                type
              }
            }
          }
        `,
        variables: {
          productReviewId: SimpleProductReview._id,
          type: 'DOWNVOTE',
          meta: {},
        },
      });
      assert.partialDeepStrictEqual(addProductReviewVote, {
        upvotes: 0,
        downvotes: 1,
        ownVotes: [
          {
            type: 'DOWNVOTE',
          },
        ],
      });
    });

    test('return not found error when passed non existing productReviewId', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation addProductReviewVote(
            $productReviewId: ID!
            $type: ProductReviewVoteType!
            $meta: JSON
          ) {
            addProductReviewVote(productReviewId: $productReviewId, type: $type, meta: $meta) {
              _id
            }
          }
        `,
        variables: {
          productReviewId: 'non-existing-id',
          type: 'UPVOTE',
          meta: {},
        },
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'ProductReviewNotFoundError');
    });

    test('return error when passed invalid productReviewId', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation addProductReviewVote(
            $productReviewId: ID!
            $type: ProductReviewVoteType!
            $meta: JSON
          ) {
            addProductReviewVote(productReviewId: $productReviewId, type: $type, meta: $meta) {
              _id
            }
          }
        `,
        variables: {
          productReviewId: '',
          type: 'UPVOTE',
          meta: {},
        },
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'InvalidIdError');
    });
  });

  test.describe('Mutation.removeProductReviewVote', async () => {
    test('remove the downvote from the review', async () => {
      const { data: { removeProductReviewVote } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation removeProductReviewVote($productReviewId: ID!, $type: ProductReviewVoteType!) {
            removeProductReviewVote(productReviewId: $productReviewId, type: $type) {
              _id
              upvotes: voteCount(type: UPVOTE)
              downvotes: voteCount(type: DOWNVOTE)
              ownVotes {
                type
              }
            }
          }
        `,
        variables: {
          productReviewId: SimpleProductReview._id,
          type: 'DOWNVOTE',
        },
      });
      assert.partialDeepStrictEqual(removeProductReviewVote, {
        upvotes: 0,
        downvotes: 0,
        ownVotes: [],
      });
    });

    test('return not found error when passed non existing productReviewId', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation removeProductReviewVote($productReviewId: ID!, $type: ProductReviewVoteType!) {
            removeProductReviewVote(productReviewId: $productReviewId, type: $type) {
              _id
            }
          }
        `,
        variables: {
          productReviewId: 'non-existing-id',
          type: 'DOWNVOTE',
        },
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'ProductReviewNotFoundError');
    });

    test('return error when passed invalid productReviewId', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation removeProductReviewVote($productReviewId: ID!, $type: ProductReviewVoteType!) {
            removeProductReviewVote(productReviewId: $productReviewId, type: $type) {
              _id
            }
          }
        `,
        variables: {
          productReviewId: '',
          type: 'DOWNVOTE',
        },
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'InvalidIdError');
    });
  });

  test.describe('Mutation.removeProductReview', async () => {
    test('remove a product review', async () => {
      const { data: { removeProductReview } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation removeProductReview($productReviewId: ID!) {
            removeProductReview(productReviewId: $productReviewId) {
              _id
              deleted
            }
          }
        `,
        variables: {
          productReviewId: SimpleProductReview._id,
        },
      });
      assert.ok(removeProductReview.deleted);
    });

    test('return not found error when passed non existing productReviewId', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation removeProductReview($productReviewId: ID!) {
            removeProductReview(productReviewId: $productReviewId) {
              _id
              deleted
            }
          }
        `,
        variables: {
          productReviewId: 'non-existing-id',
        },
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'ProductReviewNotFoundError');
    });

    test('return error when passed invalid productReviewId', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation removeProductReview($productReviewId: ID!) {
            removeProductReview(productReviewId: $productReviewId) {
              _id
              deleted
            }
          }
        `,
        variables: {
          productReviewId: '',
        },
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'InvalidIdError');
    });
  });

  test.describe('Product.reviews', async () => {
    test('product returns 1 review that is left', async () => {
      const { data: { product: { reviews } } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          query productReviews($productId: ID!) {
            product(productId: $productId) {
              _id
              reviews {
                rating
                title
              }
            }
          }
        `,
        variables: {
          productId: SimpleProduct._id,
        },
      });
      assert.deepStrictEqual(reviews, [
        {
          title: 'Hello',
          rating: 5,
        },
      ]);
    });
  });

  test.describe('Query.productReviewsCount for admin user should', async () => {
    test('Returns total number of product reviews', async () => {
      const {
        data: { productReviewsCount },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query {
            productReviewsCount
          }
        `,
      });
      assert.strictEqual(productReviewsCount, 1);
    });
  });

  test.describe('Query.productReviewsCount for logged in user should', async () => {
    test('Return NoPermissionError', async () => {
      const { errors } = await graphqlFetchAsNormalUser({
        query: /* GraphQL */ `
          query {
            productReviewsCount
          }
        `,
      });
      assert.strictEqual(errors[0]?.extensions.code, 'NoPermissionError');
    });
  });

  test.describe('Query.productReviewsCount for anonymous user should', async () => {
    test('Return NoPermissionError', async () => {
      const { errors } = await graphqlFetchAsAnonymusUser({
        query: /* GraphQL */ `
          query {
            productReviewsCount
          }
        `,
      });
      assert.strictEqual(errors[0]?.extensions.code, 'NoPermissionError');
    });
  });

  test.describe('Query.productReviews', async () => {
    test('product returns all reviews', async () => {
      const { data: { productReviews } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          query productReviews {
            productReviews {
              _id
              rating
              title
              product {
                _id
              }
            }
          }
        `,
      });
      assert.equal(productReviews.length, 1);
      assert.partialDeepStrictEqual(productReviews[0], {
        title: 'Hello',
        rating: 5,
        product: {
          _id: SimpleProduct._id,
        },
      });
    });
  });

  test.describe('Query.productReview', async () => {
    test('return product review by its ID', async () => {
      const { data: { productReview } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          query productReview($productReviewId: ID!) {
            productReview(productReviewId: $productReviewId) {
              _id
              rating
              title
              product {
                _id
              }
            }
          }
        `,
        variables: {
          productReviewId: SimpleProductReview._id,
        },
      });
      assert.partialDeepStrictEqual(productReview, {
        title: 'Title of my Review',
        rating: 1,
        product: {
          _id: SimpleProduct._id,
        },
      });
    });

    test('return error when passed invalid productReviewId', async () => {
      const { data, errors } = await graphqlFetch({
        query: /* GraphQL */ `
          query productReview($productReviewId: ID!) {
            productReview(productReviewId: $productReviewId) {
              _id
              rating
              title
              product {
                _id
              }
            }
          }
        `,
        variables: {
          productReviewId: '',
        },
      });
      assert.strictEqual(data, null);
      assert.strictEqual(errors[0]?.extensions?.code, 'InvalidIdError');
    });
  });
});
