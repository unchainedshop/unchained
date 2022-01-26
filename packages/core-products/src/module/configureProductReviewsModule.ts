import { ModuleInput, ModuleMutations, Query } from '@unchainedshop/types/common';
import {
  ProductReview,
  ProductReviewQuery,
  ProductReviewsModule,
  ProductReviewVoteType,
  ProductVote,
} from '@unchainedshop/types/products.reviews';
import { emit, registerEvents } from 'meteor/unchained:events';
import { generateDbFilterById, generateDbMutations } from 'meteor/unchained:utils';
import { ProductReviewsCollection } from '../db/ProductReviewsCollection';
import { ProductReviewsSchema, ProductReviewVoteTypes } from '../db/ProductReviewsSchema';

const PRODUCT_REVIEW_EVENTS = [
  'PRODUCT_REVIEW_CREATE',
  'PRODUCT_REMOVE_REVIEW',
  'PRODUCT_UPDATE_REVIEW',
  'PRODUCT_REVIEW_ADD_VOTE',
  'PRODUCT_REMOVE_REVIEW_VOTE',
];

const SORT_DIRECTIONS = {
  ASC: 1,
  DESC: -1,
};
const buildFindSelector = ({
  productId,
  authorId,
  deleted = null,
  queryString,
}: ProductReviewQuery = {}) => {
  const selector: Query = {
    ...(productId ? { productId } : {}),
    ...(authorId ? { authorId } : {}),
    deleted,
  };

  if (queryString) {
    selector.$text = { $search: queryString };
  }
  return selector;
};

const buildSortOptions = (sort: Array<{ key: string; value: 'DESC' | 'ASC' }>) => {
  const sortBy = {};
  sort?.forEach(({ key, value }) => {
    sortBy[key] = SORT_DIRECTIONS[value];
  });
  return sortBy;
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

  const mutations = generateDbMutations<ProductReview>(
    ProductReviews,
    ProductReviewsSchema,
  ) as ModuleMutations<ProductReview>;

  const removeVote = async (selector: Query, { userId, type }: ProductVote) => {
    await ProductReviews.updateOne(selector, {
      $pull: {
        votes: { userId, type },
      },
    });
  };

  return {
    // Queries
    findProductReview: async ({ productReviewId }) => {
      return ProductReviews.findOne(generateDbFilterById(productReviewId));
    },

    findProductReviews: async ({ offset, limit, sort, ...query }) => {
      const reviewsList = ProductReviews.find(buildFindSelector(query), {
        skip: offset,
        limit,
        sort: buildSortOptions(sort || [{ key: 'rating', value: 'DESC' }]),
      });

      return reviewsList.toArray();
    },

    count: async (query) => {
      return ProductReviews.find(buildFindSelector(query)).count();
    },

    reviewExists: async ({ productReviewId }) => {
      const productReviewCount = await ProductReviews.find(
        generateDbFilterById(productReviewId),
      ).count();

      return !!productReviewCount;
    },

    // Mutations
    create: async (doc, userId) => {
      const productReviewId = await mutations.create(doc, userId);

      const productReview = await ProductReviews.findOne(generateDbFilterById(productReviewId));

      emit('PRODUCT_REVIEW_CREATE', {
        productReview,
      });

      return productReview;
    },

    delete: async (productReviewId, userId) => {
      const deletedCount = await mutations.delete(productReviewId, userId);

      emit('PRODUCT_REMOVE_REVIEW', {
        productReviewId,
      });

      return deletedCount;
    },

    update: async (productReviewId, doc, userId) => {
      await mutations.update(productReviewId, doc, userId);

      const productReview = ProductReviews.findOne(
        generateDbFilterById(productReviewId, {
          deleted: null,
        }),
      );

      emit('PRODUCT_UPDATE_REVIEW', { productReview });

      return productReview;
    },

    votes: {
      userIdsThatVoted,

      ownVotes: (productReview, { userId: ownUserId }) => {
        return (productReview.votes || []).filter(({ userId }) => userId === ownUserId);
      },

      addVote: async (
        productReview,
        { type = ProductReviewVoteTypes.UPVOTE as ProductReviewVoteType, meta },
        userId,
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

          await ProductReviews.updateOne(selector, {
            $push: {
              votes: {
                timestamp: new Date(),
                type,
                meta,
                userId,
              },
            },
          });

          const updatedProductReview = await ProductReviews.findOne(selector);

          emit('PRODUCT_REVIEW_ADD_VOTE', {
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

        const productReview = await ProductReviews.findOne(selector);

        emit('PRODUCT_REMOVE_REVIEW_VOTE', {
          productReviewId,
          userId,
          type,
        });

        return productReview;
      },
    },
  };
};
