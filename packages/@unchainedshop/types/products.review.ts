import { Context } from './api';
import { ModuleMutations, TimestampFields, _ID } from './common';

export enum ProductReviewVoteType {
  UPVOTE = 'UPVOTE',
  DOWNVOTE = 'DOWNVOTE',
  REPORT = 'REPORT',
}

interface ProductVote {
  timestamp: Date;
  userId: string;
  type: ProductReviewVoteType;
  meta?: any;
}

export type ProductReview = {
  _id?: _ID;
  productId: string;
  authorId: string;
  rating: number;
  title?: string;
  review?: string;
  meta?: any;
  votes: Array<ProductVote>;
} & TimestampFields;

type ProductReviewQuery = {
  productId?: string;
  authorId?: string;
  deleted?: Date | null;
  queryString?: string;
};
export type ProductReviewModule = ModuleMutations<ProductReview> & {
  // Queries
  findProductReview: (query: {
    productReviewId: string;
  }) => Promise<ProductReview>;

  findProductReviews: (
    query: ProductReviewQuery & {
      limit: number;
      offset: number;
      sort: Array<{ key: string; value: 'DESC' | 'ASC' }>;
    }
  ) => Promise<Array<ProductReview>>;

  count: (query: ProductReviewQuery) => Promise<number>;
  reviewExists: (query: { productReviewId: string }) => Promise<boolean>;

  // Mutations
  create: (doc: ProductReview, userId?: string) => Promise<ProductReview>;

  delete: (productId: string, userId?: string) => Promise<ProductReview>;

  update: (
    params: {
      sortKeys: Array<{
        productReviewId: string;
        sortKey: number;
      }>;
    },
    userId?: string
  ) => Promise<Array<ProductReview>>;

  /*
   * Product review votes
   */

  votes: {
    // Queries
    userIdsThatVoted: (
      productReview: ProductReview,
      query: { type: ProductReviewVoteType }
    ) => Array<string>;

    ownVotes: (
      productReview: ProductReview,
      query: { userId: string }
    ) => Array<ProductVote>;

    // Implement directly in api/types
    // voteCount: ( { type = ProductReviewVoteTypes.UPVOTE }) {
    //   return this.userIdsThatVoted({ type }).length;
    // },

    // Mutations
    add: (
      productReviewId: string,
      doc: ProductVote,
      userId?: string
    ) => Promise<ProductReview>;

    delete: (
      productReviewId: string,
      doc: Pick<ProductVote, 'userId' | 'type'>,
      userId?: string
    ) => Promise<ProductReview>;
  };
};

type HelperType<P, T> = (
  productReview: ProductReview,
  params: P,
  context: Context
) => T;

export interface ProductReviewHelperTypes {}
