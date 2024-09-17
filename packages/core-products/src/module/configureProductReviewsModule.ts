import { ModuleInput } from '@unchainedshop/core';
import { ProductReview, ProductReviewQuery, ProductReviewVoteType, ProductVote } from '../types.js';
import { emit, registerEvents } from '@unchainedshop/events';
import {
  generateDbFilterById,
  buildSortOptions,
  mongodb,
  generateDbObjectId,
} from '@unchainedshop/mongodb';
import { SortDirection, SortOption } from '@unchainedshop/utils';
import { ProductReviewsCollection } from '../db/ProductReviewsCollection.js';

export const ProductReviewVoteTypes = {
  UPVOTE: 'UPVOTE',
  DOWNVOTE: 'DOWNVOTE',
  REPORT: 'REPORT',
};
export type ProductReviewsModule = {
  // Queries
  findProductReview: (query: { productReviewId: string }) => Promise<ProductReview>;

  findProductReviews: (
    query: ProductReviewQuery & {
      limit?: number;
      offset?: number;
      sort?: Array<SortOption>;
    },
  ) => Promise<Array<ProductReview>>;

  count: (query: ProductReviewQuery) => Promise<number>;
  reviewExists: (query: { productReviewId: string }) => Promise<boolean>;

  // Mutations
  create: (doc: ProductReview) => Promise<ProductReview>;

  delete: (productPreviewId: string) => Promise<number>;

  deleteMany: (selector: mongodb.Filter<ProductReview>) => Promise<number>;

  update: (productReviewId: string, doc: ProductReview) => Promise<ProductReview>;

  /*
   * Product review votes
   */

  votes: {
    // Queries
    userIdsThatVoted: (
      productReview: ProductReview,
      query: { type: ProductReviewVoteType },
    ) => Array<string>;

    ownVotes: (productReview: ProductReview, query: { userId: string }) => Array<ProductVote>;

    // Mutations
    addVote: (productReview: ProductReview, doc: ProductVote) => Promise<ProductReview>;

    removeVote: (productReviewId: string, doc: ProductVote) => Promise<ProductReview>;
  };
};

const PRODUCT_REVIEW_EVENTS = [
  'PRODUCT_REVIEW_CREATE',
  'PRODUCT_REMOVE_REVIEW',
  'PRODUCT_UPDATE_REVIEW',
  'PRODUCT_REVIEW_ADD_VOTE',
  'PRODUCT_REMOVE_REVIEW_VOTE',
];

export const buildFindSelector = ({
  productId,
  authorId,
  queryString,
  created,
  updated,
}: ProductReviewQuery = {}) => {
  const selector: mongodb.Filter<ProductReview> = {
    ...(productId ? { productId } : {}),
    ...(authorId ? { authorId } : {}),
    deleted: null,
  };

  if (queryString) {
    (selector as any).$text = { $search: queryString };
  }

  if (created) {
    selector.created = created?.end
      ? { $gte: created?.start || new Date(0), $lte: created.end }
      : { $gte: created?.start || new Date(0) };
  }
  if (updated) {
    selector.updated = updated?.end
      ? { $gte: updated?.start || new Date(0), $lte: updated.end }
      : { $gte: updated?.start || new Date(0) };
  }

  return selector;
};

const userIdsThatVoted: ProductReviewsModule['votes']['userIdsThatVoted'] = (
  productReview,
  { type = ProductReviewVoteTypes.UPVOTE },
) => {
  return (productReview.votes || [])
    .filter(({ type: currentType }) => type === currentType)
    .map(({ userId }) => userId);
};

export const configureProductReviewsModule = async ({
  db,
}: ModuleInput<Record<string, never>>): Promise<ProductReviewsModule> => {
  registerEvents(PRODUCT_REVIEW_EVENTS);

  const { ProductReviews } = await ProductReviewsCollection(db);

  const removeVote = async (selector: mongodb.Filter<ProductReview>, { userId, type }: ProductVote) => {
    await ProductReviews.updateOne(selector, {
      $pull: {
        votes: { userId, type },
      },
    });
  };

  return {
    // Queries
    findProductReview: async ({ productReviewId }) =>
      ProductReviews.findOne(generateDbFilterById(productReviewId), {}),

    findProductReviews: async ({ offset, limit, sort, ...query }) => {
      const reviewsList = ProductReviews.find(buildFindSelector(query), {
        skip: offset,
        limit,
        sort: buildSortOptions(
          sort || ([{ key: 'created', value: SortDirection.DESC }] as SortOption[]),
        ),
      });

      return reviewsList.toArray();
    },

    count: async (query) => {
      return ProductReviews.countDocuments(buildFindSelector(query));
    },

    reviewExists: async ({ productReviewId }) => {
      const productReviewCount = await ProductReviews.countDocuments(
        generateDbFilterById(productReviewId, { deleted: null }),
        { limit: 1 },
      );

      return !!productReviewCount;
    },

    // Mutations
    create: async (doc) => {
      const { insertedId: productReviewId } = await ProductReviews.insertOne({
        _id: generateDbObjectId(),
        created: new Date(),
        ...doc,
      });

      const productReview = await ProductReviews.findOne(generateDbFilterById(productReviewId), {});

      await emit('PRODUCT_REVIEW_CREATE', {
        productReview,
      });

      return productReview;
    },

    delete: async (productReviewId) => {
      const { modifiedCount: deletedCount } = await ProductReviews.updateOne(
        generateDbFilterById(productReviewId),
        {
          $set: {
            deleted: new Date(),
          },
        },
      );

      await emit('PRODUCT_REMOVE_REVIEW', {
        productReviewId,
      });

      return deletedCount;
    },

    deleteMany: async (selector) => {
      const productReviews = await ProductReviews.find(selector, {
        projection: { _id: 1 },
      }).toArray();

      const deletionResult = await ProductReviews.deleteMany(selector);

      await Promise.all(
        productReviews.map(async (assortmentFilter) =>
          emit('PRODUCT_REMOVE_REVIEW', {
            assortmentFilterId: assortmentFilter._id,
          }),
        ),
      );

      return deletionResult.deletedCount;
    },

    update: async (productReviewId, doc) => {
      const productReview = await ProductReviews.findOneAndUpdate(
        generateDbFilterById(productReviewId),
        {
          $set: {
            updated: new Date(),
            ...doc,
          },
        },
        { returnDocument: 'after' },
      );

      await emit('PRODUCT_UPDATE_REVIEW', { productReview });

      return productReview;
    },

    votes: {
      userIdsThatVoted,

      ownVotes: (productReview, { userId: ownUserId }) => {
        return (productReview.votes || []).filter(({ userId }) => userId === ownUserId);
      },

      addVote: async (
        productReview,
        { userId, type = ProductReviewVoteTypes.UPVOTE as ProductReviewVoteType, meta },
      ) => {
        if (!userIdsThatVoted(productReview, { type }).includes(userId)) {
          const selector = generateDbFilterById(productReview._id, {
            deleted: null,
          });

          if (type === ProductReviewVoteTypes.UPVOTE) {
            // if this is an upvote, remove the downvote first
            await removeVote(selector, {
              userId,
              type: ProductReviewVoteTypes.DOWNVOTE as ProductReviewVoteType,
            });
          }
          if (type === ProductReviewVoteTypes.DOWNVOTE) {
            // if this is a downvote, remove the upvote first
            await removeVote(selector, {
              userId,
              type: ProductReviewVoteTypes.UPVOTE as ProductReviewVoteType,
            });
          }

          const updatedProductReview = await ProductReviews.findOneAndUpdate(
            selector,
            {
              $push: {
                votes: {
                  timestamp: new Date(),
                  type,
                  meta,
                  userId,
                },
              },
            },
            { returnDocument: 'after' },
          );

          await emit('PRODUCT_REVIEW_ADD_VOTE', {
            productReview: updatedProductReview,
          });

          return updatedProductReview;
        }

        return null;
      },

      removeVote: async (
        productReviewId,
        { userId, type = ProductReviewVoteTypes.UPVOTE as ProductReviewVoteType },
      ) => {
        const selector = generateDbFilterById(productReviewId, {
          deleted: null,
        });
        await removeVote(selector, {
          userId,
          type,
        });

        const productReview = await ProductReviews.findOne(selector, {});

        await emit('PRODUCT_REMOVE_REVIEW_VOTE', {
          productReviewId,
          userId,
          type,
        });

        return productReview;
      },
    },
  };
};
