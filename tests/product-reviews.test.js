import {
  setupDatabase,
  createLoggedInGraphqlFetch,
  createAnonymousGraphqlFetch,
} from './helpers.js';
import { SimpleProduct, SimpleProductReview } from './seeds/products.js';
import { ADMIN_TOKEN, USER_TOKEN } from './seeds/users.js';

let graphqlFetch;
let graphqlFetchAsNormalUser;
let graphqlFetchAsAnonymusUser;

describe('Products: Reviews', () => {
  beforeAll(async () => {
    await setupDatabase();
    graphqlFetch = await createLoggedInGraphqlFetch(ADMIN_TOKEN);
    graphqlFetchAsNormalUser = await createLoggedInGraphqlFetch(USER_TOKEN);
    graphqlFetchAsAnonymusUser = await createAnonymousGraphqlFetch();
  });

  describe('Mutation.createProductReview', () => {
    it('create a new product review', async () => {
      const { data: { createProductReview } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation createProductReview(
            $productId: ID!
            $productReview: ProductReviewInput!
          ) {
            createProductReview(
              productId: $productId
              productReview: $productReview
            ) {
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
      expect(createProductReview).toMatchObject({
        author: {
          username: 'admin',
        },
        product: {
          _id: SimpleProduct._id,
        },
        rating: 5,
        title: 'Hello',
        review: 'World',
        upvotes: 0,
        downvotes: 0,
        reports: 0,
        ownVotes: [],
      });
    });

    it('return not found error when passed non existing productId', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation createProductReview(
            $productId: ID!
            $productReview: ProductReviewInput!
          ) {
            createProductReview(
              productId: $productId
              productReview: $productReview
            ) {
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
      expect(errors[0]?.extensions?.code).toEqual('ProductNotFoundError');
    });

    it('return error when passed invalid productId', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation createProductReview(
            $productId: ID!
            $productReview: ProductReviewInput!
          ) {
            createProductReview(
              productId: $productId
              productReview: $productReview
            ) {
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
      expect(errors[0]?.extensions?.code).toEqual('InvalidIdError');
    });
  });
  describe('Mutation.updateProductReview', () => {
    it('update a product review', async () => {
      const { data: { updateProductReview } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation updateProductReview(
            $productReviewId: ID!
            $productReview: ProductReviewInput!
          ) {
            updateProductReview(
              productReviewId: $productReviewId
              productReview: $productReview
            ) {
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
      expect(updateProductReview).toMatchObject({
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

    it('return not found error when passed non existing productReviewId', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation updateProductReview(
            $productReviewId: ID!
            $productReview: ProductReviewInput!
          ) {
            updateProductReview(
              productReviewId: $productReviewId
              productReview: $productReview
            ) {
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
      expect(errors[0]?.extensions?.code).toEqual('ProductReviewNotFoundError');
    });

    it('return error when passed invalid productReviewId', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation updateProductReview(
            $productReviewId: ID!
            $productReview: ProductReviewInput!
          ) {
            updateProductReview(
              productReviewId: $productReviewId
              productReview: $productReview
            ) {
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
      expect(errors[0]?.extensions?.code).toEqual('InvalidIdError');
    });
  });
  describe('Mutation.addProductReviewVote', () => {
    it('upvote a review', async () => {
      const { data: { addProductReviewVote } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation addProductReviewVote(
            $productReviewId: ID!
            $type: ProductReviewVoteType!
            $meta: JSON
          ) {
            addProductReviewVote(
              productReviewId: $productReviewId
              type: $type
              meta: $meta
            ) {
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
      expect(addProductReviewVote).toMatchObject({
        upvotes: 1,
        downvotes: 0,
        ownVotes: [
          {
            type: 'UPVOTE',
          },
        ],
      });
    });

    it('downvote same review', async () => {
      const { data: { addProductReviewVote } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation addProductReviewVote(
            $productReviewId: ID!
            $type: ProductReviewVoteType!
            $meta: JSON
          ) {
            addProductReviewVote(
              productReviewId: $productReviewId
              type: $type
              meta: $meta
            ) {
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
      expect(addProductReviewVote).toMatchObject({
        upvotes: 0,
        downvotes: 1,
        ownVotes: [
          {
            type: 'DOWNVOTE',
          },
        ],
      });
    });

    it('return not found error when passed non existing productReviewId', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation addProductReviewVote(
            $productReviewId: ID!
            $type: ProductReviewVoteType!
            $meta: JSON
          ) {
            addProductReviewVote(
              productReviewId: $productReviewId
              type: $type
              meta: $meta
            ) {
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
      expect(errors[0]?.extensions?.code).toEqual('ProductReviewNotFoundError');
    });

    it('return error when passed invalid productReviewId', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation addProductReviewVote(
            $productReviewId: ID!
            $type: ProductReviewVoteType!
            $meta: JSON
          ) {
            addProductReviewVote(
              productReviewId: $productReviewId
              type: $type
              meta: $meta
            ) {
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
      expect(errors[0]?.extensions?.code).toEqual('InvalidIdError');
    });
  });
  describe('Mutation.removeProductReviewVote', () => {
    it('remove the downvote from the review', async () => {
      const { data: { removeProductReviewVote } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation removeProductReviewVote(
            $productReviewId: ID!
            $type: ProductReviewVoteType!
          ) {
            removeProductReviewVote(
              productReviewId: $productReviewId
              type: $type
            ) {
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
      expect(removeProductReviewVote).toMatchObject({
        upvotes: 0,
        downvotes: 0,
        ownVotes: [],
      });
    });

    it('return not found error when passed non existing productReviewId', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation removeProductReviewVote(
            $productReviewId: ID!
            $type: ProductReviewVoteType!
          ) {
            removeProductReviewVote(
              productReviewId: $productReviewId
              type: $type
            ) {
              _id
            }
          }
        `,
        variables: {
          productReviewId: 'non-existing-id',
          type: 'DOWNVOTE',
        },
      });
      expect(errors[0]?.extensions?.code).toEqual('ProductReviewNotFoundError');
    });

    it('return error when passed invalid productReviewId', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation removeProductReviewVote(
            $productReviewId: ID!
            $type: ProductReviewVoteType!
          ) {
            removeProductReviewVote(
              productReviewId: $productReviewId
              type: $type
            ) {
              _id
            }
          }
        `,
        variables: {
          productReviewId: '',
          type: 'DOWNVOTE',
        },
      });
      expect(errors[0]?.extensions?.code).toEqual('InvalidIdError');
    });
  });
  describe('Mutation.removeProductReview', () => {
    it('remove a product review', async () => {
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
      expect(removeProductReview.deleted).toBeTruthy();
    });

    it('return not found error when passed non existing productReviewId', async () => {
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
      expect(errors[0]?.extensions?.code).toEqual('ProductReviewNotFoundError');
    });

    it('return error when passed invalid productReviewId', async () => {
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
      expect(errors[0]?.extensions?.code).toEqual('InvalidIdError');
    });
  });
  describe('Product.reviews', () => {
    it('product returns 1 review that is left', async () => {
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
      expect(reviews).toMatchObject([
        {
          title: 'Hello',
          rating: 5,
        },
      ]);
    });
  });

  describe('Query.productReviewsCount for admin user should', () => {
    it('Returns total number of product reviews', async () => {
      const {
        data: { productReviewsCount },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query {
            productReviewsCount
          }
        `,
      });
      expect(productReviewsCount).toEqual(1);
    });
  });

  describe('Query.productReviewsCount for logged in user should', () => {
    it('Return NoPermissionError', async () => {
      const { errors } = await graphqlFetchAsNormalUser({
        query: /* GraphQL */ `
          query {
            productReviewsCount
          }
        `,
      });
      expect(errors[0]?.extensions.code).toEqual('NoPermissionError');
    });
  });

  describe('Query.productReviewsCount for anonymous user should', () => {
    it('Return NoPermissionError', async () => {
      const { errors } = await graphqlFetchAsAnonymusUser({
        query: /* GraphQL */ `
          query {
            productReviewsCount
          }
        `,
      });
      expect(errors[0]?.extensions.code).toEqual('NoPermissionError');
    });
  });

  describe('Query.productReviews', () => {
    it('product returns all reviews', async () => {
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
      expect(productReviews).toMatchObject([
        {
          title: 'Hello',
          rating: 5,
          product: {
            _id: SimpleProduct._id,
          },
        },
      ]);
    });
  });
  describe('Query.productReview', () => {
    it('return product review by its ID', async () => {
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
      expect(productReview).toMatchObject({
        title: 'Title of my Review',
        rating: 1,
        product: {
          _id: SimpleProduct._id,
        },
      });
    });

    it('return error when passed invalid productReviewId', async () => {
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
      expect(data).toBe(null);
      expect(errors[0]?.extensions?.code).toEqual('InvalidIdError');
    });
  });
});
