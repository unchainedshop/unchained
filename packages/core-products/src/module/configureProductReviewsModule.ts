/**
 * Product Reviews Module - Drizzle ORM with SQLite/Turso
 */

import { emit, registerEvents } from '@unchainedshop/events';
import { SortDirection, type SortOption } from '@unchainedshop/utils';
import {
  eq,
  and,
  notInArray,
  isNull,
  gte,
  lte,
  desc,
  asc,
  sql,
  generateId,
  type DrizzleDb,
  type SQL,
} from '@unchainedshop/store';
import {
  productReviews,
  ProductReviewVoteType,
  type ProductReviewRow,
  type ProductVote,
  type ProductReviewVoteTypeType,
} from '../db/index.ts';

export interface ProductReviewQuery {
  productId?: string;
  authorId?: string;
  created?: { end?: Date; start?: Date };
  updated?: { end?: Date; start?: Date };
}

const PRODUCT_REVIEW_EVENTS = [
  'PRODUCT_REVIEW_CREATE',
  'PRODUCT_REMOVE_REVIEW',
  'PRODUCT_UPDATE_REVIEW',
  'PRODUCT_REVIEW_ADD_VOTE',
  'PRODUCT_REMOVE_REVIEW_VOTE',
];

export type ProductReview = ProductReviewRow;
export { ProductReviewVoteType, type ProductVote, type ProductReviewVoteTypeType };

const COLUMNS = {
  _id: productReviews._id,
  productId: productReviews.productId,
  authorId: productReviews.authorId,
  rating: productReviews.rating,
  title: productReviews.title,
  review: productReviews.review,
  meta: productReviews.meta,
  votes: productReviews.votes,
  created: productReviews.created,
  updated: productReviews.updated,
  deleted: productReviews.deleted,
} as const;

const userIdsThatVoted = (
  productReview: ProductReview,
  { type = ProductReviewVoteType.UPVOTE }: { type: ProductReviewVoteTypeType },
): string[] => {
  return (productReview.votes || [])
    .filter(({ type: currentType }) => type === currentType)
    .map(({ userId }) => userId)
    .filter(Boolean) as string[];
};

export const configureProductReviewsModule = ({ db }: { db: DrizzleDb }) => {
  registerEvents(PRODUCT_REVIEW_EVENTS);

  const buildConditions = async (query: ProductReviewQuery): Promise<SQL[]> => {
    const conditions: SQL[] = [isNull(productReviews.deleted)];

    if (query.productId) {
      conditions.push(eq(productReviews.productId, query.productId));
    }
    if (query.authorId) {
      conditions.push(eq(productReviews.authorId, query.authorId));
    }
    if (query.created) {
      if (query.created.start) {
        conditions.push(gte(productReviews.created, query.created.start));
      }
      if (query.created.end) {
        conditions.push(lte(productReviews.created, query.created.end));
      }
    }
    if (query.updated) {
      if (query.updated.start) {
        conditions.push(gte(productReviews.updated, query.updated.start));
      }
      if (query.updated.end) {
        conditions.push(lte(productReviews.updated, query.updated.end));
      }
    }

    return conditions;
  };

  const buildSortOrder = (sort?: SortOption[]) => {
    if (!sort?.length) {
      return [desc(productReviews.created)];
    }

    return sort.map(({ key, value }) => {
      const column = COLUMNS[key as keyof typeof COLUMNS] ?? productReviews.created;
      return value === SortDirection.ASC ? asc(column) : desc(column);
    });
  };

  const removeVote = async (
    reviewId: string,
    { userId, type }: { userId?: string; type: ProductReviewVoteTypeType },
  ) => {
    const [review] = await db
      .select()
      .from(productReviews)
      .where(and(eq(productReviews._id, reviewId), isNull(productReviews.deleted)))
      .limit(1);

    if (!review) return;

    const updatedVotes = (review.votes || []).filter(
      (vote) => !(vote.userId === userId && vote.type === type),
    );

    await db
      .update(productReviews)
      .set({ votes: updatedVotes, updated: new Date() })
      .where(eq(productReviews._id, reviewId));
  };

  return {
    // Queries
    findProductReview: async ({
      productReviewId,
    }: {
      productReviewId: string;
    }): Promise<ProductReview | null> => {
      const [result] = await db
        .select()
        .from(productReviews)
        .where(eq(productReviews._id, productReviewId))
        .limit(1);
      return result || null;
    },

    findProductReviews: async ({
      offset,
      limit,
      sort,
      ...query
    }: ProductReviewQuery & {
      limit?: number;
      offset?: number;
      sort?: SortOption[];
    }): Promise<ProductReview[]> => {
      const conditions = await buildConditions(query);
      const sortOrder = buildSortOrder(sort);

      let dbQuery = db
        .select()
        .from(productReviews)
        .where(and(...conditions));

      if (sortOrder.length > 0) {
        dbQuery = dbQuery.orderBy(...sortOrder) as typeof dbQuery;
      }
      if (offset !== undefined) {
        dbQuery = dbQuery.offset(offset) as typeof dbQuery;
      }
      if (limit !== undefined) {
        dbQuery = dbQuery.limit(limit) as typeof dbQuery;
      }

      return dbQuery;
    },

    count: async (query: ProductReviewQuery): Promise<number> => {
      const conditions = await buildConditions(query);
      const [result] = await db
        .select({ count: sql<number>`count(*)` })
        .from(productReviews)
        .where(and(...conditions));
      return result?.count || 0;
    },

    reviewExists: async ({ productReviewId }: { productReviewId: string }): Promise<boolean> => {
      const [result] = await db
        .select({ count: sql<number>`count(*)` })
        .from(productReviews)
        .where(and(eq(productReviews._id, productReviewId), isNull(productReviews.deleted)))
        .limit(1);
      return (result?.count || 0) > 0;
    },

    // Mutations
    create: async (doc: {
      productId: string;
      authorId: string;
      rating: number;
      title?: string | null;
      review?: string | null;
      meta?: unknown;
      _id?: string;
      created?: Date;
    }): Promise<ProductReview> => {
      const reviewId = doc._id || generateId();
      await db.insert(productReviews).values({
        _id: reviewId,
        created: doc.created || new Date(),
        votes: [],
        ...doc,
      });

      const [inserted] = await db
        .select()
        .from(productReviews)
        .where(eq(productReviews._id, reviewId))
        .limit(1);

      await emit('PRODUCT_REVIEW_CREATE', {
        productReview: inserted,
      });

      return inserted;
    },

    delete: async (productReviewId: string): Promise<number> => {
      const result = await db
        .update(productReviews)
        .set({ deleted: new Date() })
        .where(eq(productReviews._id, productReviewId));

      await emit('PRODUCT_REMOVE_REVIEW', {
        productReviewId,
      });

      return result.rowsAffected;
    },

    deleteMany: async ({
      productId,
      excludedProductIds,
      authorId,
    }: {
      productId?: string;
      excludedProductIds?: string[];
      authorId?: string;
    }): Promise<number> => {
      const conditions: SQL[] = [];

      if (authorId) {
        conditions.push(eq(productReviews.authorId, authorId));
      }
      if (productId) {
        conditions.push(eq(productReviews.productId, productId));
      } else if (excludedProductIds?.length) {
        conditions.push(notInArray(productReviews.productId, excludedProductIds));
      }

      if (conditions.length === 0) return 0;

      // Get IDs for events
      const toDelete = await db
        .select({ _id: productReviews._id })
        .from(productReviews)
        .where(and(...conditions));

      const result = await db.delete(productReviews).where(and(...conditions));

      await Promise.all(
        toDelete.map(async (review) =>
          emit('PRODUCT_REMOVE_REVIEW', {
            productReviewId: review._id,
          }),
        ),
      );

      return result.rowsAffected;
    },

    deleteByAuthorId: async (authorId: string): Promise<number> => {
      const toDelete = await db
        .select({ _id: productReviews._id })
        .from(productReviews)
        .where(eq(productReviews.authorId, authorId));

      const result = await db.delete(productReviews).where(eq(productReviews.authorId, authorId));

      await Promise.all(
        toDelete.map(async (review) =>
          emit('PRODUCT_REMOVE_REVIEW', {
            productReviewId: review._id,
          }),
        ),
      );

      return result.rowsAffected;
    },

    update: async (
      productReviewId: string,
      doc: Partial<ProductReview>,
    ): Promise<ProductReview | null> => {
      await db
        .update(productReviews)
        .set({
          ...doc,
          updated: new Date(),
        })
        .where(eq(productReviews._id, productReviewId));

      const [updated] = await db
        .select()
        .from(productReviews)
        .where(eq(productReviews._id, productReviewId))
        .limit(1);

      if (!updated) return null;

      await emit('PRODUCT_UPDATE_REVIEW', { productReview: updated });
      return updated;
    },

    votes: {
      userIdsThatVoted,

      ownVotes: (
        productReview: ProductReview,
        { userId: ownUserId }: { userId: string },
      ): ProductVote[] => {
        return (productReview.votes || []).filter(({ userId }) => userId === ownUserId);
      },

      addVote: async (
        productReview: ProductReview,
        {
          userId,
          type = ProductReviewVoteType.UPVOTE as ProductReviewVoteTypeType,
          meta,
        }: { userId: string; type: ProductReviewVoteTypeType; meta?: Record<string, any> },
      ): Promise<ProductReview | null> => {
        if (!userIdsThatVoted(productReview, { type }).includes(userId)) {
          if (type === ProductReviewVoteType.UPVOTE) {
            // if this is an upvote, remove the downvote first
            await removeVote(productReview._id, {
              userId,
              type: ProductReviewVoteType.DOWNVOTE as ProductReviewVoteTypeType,
            });
          }
          if (type === ProductReviewVoteType.DOWNVOTE) {
            // if this is a downvote, remove the upvote first
            await removeVote(productReview._id, {
              userId,
              type: ProductReviewVoteType.UPVOTE as ProductReviewVoteTypeType,
            });
          }

          // Get current review to get current votes
          const [current] = await db
            .select()
            .from(productReviews)
            .where(and(eq(productReviews._id, productReview._id), isNull(productReviews.deleted)))
            .limit(1);

          if (!current) return null;

          const newVote: ProductVote = {
            timestamp: new Date(),
            type,
            meta,
            userId,
          };

          await db
            .update(productReviews)
            .set({
              votes: [...(current.votes || []), newVote],
              updated: new Date(),
            })
            .where(eq(productReviews._id, productReview._id));

          const [updated] = await db
            .select()
            .from(productReviews)
            .where(eq(productReviews._id, productReview._id))
            .limit(1);

          if (!updated) return null;

          await emit('PRODUCT_REVIEW_ADD_VOTE', {
            productReview: updated,
          });
          return updated;
        }

        return null;
      },

      removeVote: async (
        productReviewId: string,
        {
          userId,
          type = ProductReviewVoteType.UPVOTE as ProductReviewVoteTypeType,
        }: { userId?: string; type: ProductReviewVoteTypeType },
      ): Promise<ProductReview | null> => {
        await removeVote(productReviewId, { userId, type });

        const [review] = await db
          .select()
          .from(productReviews)
          .where(and(eq(productReviews._id, productReviewId), isNull(productReviews.deleted)))
          .limit(1);

        await emit('PRODUCT_REMOVE_REVIEW_VOTE', {
          productReviewId,
          userId,
          type,
        });

        return review || null;
      },
    },
  };
};

export type ProductReviewsModule = ReturnType<typeof configureProductReviewsModule>;
