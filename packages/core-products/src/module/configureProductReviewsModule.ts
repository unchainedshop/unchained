import { ModuleInput } from '@unchainedshop/mongodb';
import { emit, registerEvents } from '@unchainedshop/events';
import {
  generateDbFilterById,
  buildSortOptions,
  mongodb,
  generateDbObjectId,
} from '@unchainedshop/mongodb';
import { SortDirection, SortOption } from '@unchainedshop/utils';
import {
  ProductReview,
  ProductReviewsCollection,
  ProductReviewVoteType,
  ProductVote,
} from '../db/ProductReviewsCollection.js';

export type ProductReviewQuery = {
  productId?: string;
  authorId?: string;
  queryString?: string;
  created?: { end?: Date; start?: Date };
  updated?: { end?: Date; start?: Date };
};

const PRODUCT_REVIEW_EVENTS = [
  'PRODUCT_REVIEW_CREATE',
  'PRODUCT_REMOVE_REVIEW',
  'PRODUCT_UPDATE_REVIEW',
  'PRODUCT_REVIEW_ADD_VOTE',
  'PRODUCT_REMOVE_REVIEW_VOTE',
];

const buildFindSelector = ({
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

const userIdsThatVoted = (
  productReview: ProductReview,
  { type = ProductReviewVoteType.UPVOTE }: { type: ProductReviewVoteType },
): Array<string> => {
  return (productReview.votes || [])
    .filter(({ type: currentType }) => type === currentType)
    .map(({ userId }) => userId);
};

export const configureProductReviewsModule = async ({ db }: ModuleInput<Record<string, never>>) => {
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
    findProductReview: async ({
      productReviewId,
    }: {
      productReviewId: string;
    }): Promise<ProductReview> => ProductReviews.findOne(generateDbFilterById(productReviewId), {}),

    findProductReviews: async ({
      offset,
      limit,
      sort,
      ...query
    }: ProductReviewQuery & {
      limit?: number;
      offset?: number;
      sort?: Array<SortOption>;
    }): Promise<Array<ProductReview>> => {
      const reviewsList = ProductReviews.find(buildFindSelector(query), {
        skip: offset,
        limit,
        sort: buildSortOptions(
          sort || ([{ key: 'created', value: SortDirection.DESC }] as SortOption[]),
        ),
      });

      return reviewsList.toArray();
    },

    count: async (query: ProductReviewQuery): Promise<number> => {
      return ProductReviews.countDocuments(buildFindSelector(query));
    },

    reviewExists: async ({ productReviewId }: { productReviewId: string }): Promise<boolean> => {
      const productReviewCount = await ProductReviews.countDocuments(
        generateDbFilterById(productReviewId, { deleted: null }),
        { limit: 1 },
      );

      return !!productReviewCount;
    },

    // Mutations
    create: async (doc: ProductReview): Promise<ProductReview> => {
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

    delete: async (productReviewId: string): Promise<number> => {
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

    deleteMany: async (selector: mongodb.Filter<ProductReview>): Promise<number> => {
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

    update: async (productReviewId: string, doc: Partial<ProductReview>): Promise<ProductReview> => {
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

      ownVotes: (
        productReview: ProductReview,
        { userId: ownUserId }: { userId: string },
      ): Array<ProductVote> => {
        return (productReview.votes || []).filter(({ userId }) => userId === ownUserId);
      },

      addVote: async (
        productReview: ProductReview,
        { userId, type = ProductReviewVoteType.UPVOTE as ProductReviewVoteType, meta }: ProductVote,
      ): Promise<ProductReview> => {
        if (!userIdsThatVoted(productReview, { type }).includes(userId)) {
          const selector = generateDbFilterById(productReview._id, {
            deleted: null,
          });

          if (type === ProductReviewVoteType.UPVOTE) {
            // if this is an upvote, remove the downvote first
            await removeVote(selector, {
              userId,
              type: ProductReviewVoteType.DOWNVOTE as ProductReviewVoteType,
            });
          }
          if (type === ProductReviewVoteType.DOWNVOTE) {
            // if this is a downvote, remove the upvote first
            await removeVote(selector, {
              userId,
              type: ProductReviewVoteType.UPVOTE as ProductReviewVoteType,
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
        productReviewId: string,
        { userId, type = ProductReviewVoteType.UPVOTE as ProductReviewVoteType }: ProductVote,
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
