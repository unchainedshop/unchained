import { setupDatabase, createLoggedInGraphqlFetch } from './helpers';
import { SimpleProduct, SimpleProductReview } from './seeds/products';
import { ADMIN_TOKEN } from './seeds/users';

let connection;
let db; // eslint-disable-line
let graphqlFetch;

describe('Products: Reviews', () => {
  beforeAll(async () => {
    [db, connection] = await setupDatabase();
    graphqlFetch = await createLoggedInGraphqlFetch(ADMIN_TOKEN);
  });

  afterAll(async () => {
    await connection.close();
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
              meta
              upvotes: voteCount(type: UPVOTE)
              downvotes: voteCount(type: DOWNVOTE)
              reports: voteCount(type: REPORT)
              ownVotes {
                _id
                timestamp
                type
                meta
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
        meta: {},
        upvotes: 0,
        downvotes: 0,
        reports: 0,
        ownVotes: [],
      });
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
              meta
              upvotes: voteCount(type: UPVOTE)
              downvotes: voteCount(type: DOWNVOTE)
              reports: voteCount(type: REPORT)
              ownVotes {
                _id
                timestamp
                type
                meta
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
        meta: {},
        upvotes: 0,
        downvotes: 0,
        reports: 0,
        ownVotes: [],
      });
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
          meta: {},
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
    it('product returns all reviews', async () => {
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
  });
});
