import { Context } from './api';
import { ModuleMutations, TimestampFields, _ID } from './common';

export enum ProductReviewVoteType {
  UPVOTE = 'UPVOTE',
  DOWNVOTE = 'DOWNVOTE',
  REPORT = 'REPORT',
}

export interface ProductVote {
  meta?: any;
  timestamp?: Date;
  type: ProductReviewVoteType;
  userId?: string;
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

export type ProductReviewQuery = {
  productId?: string;
  authorId?: string;
  deleted?: Date | null;
  queryString?: string;
};
export type ProductReviewsModule = {
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

  delete: (productPreviewId: string, userId?: string) => Promise<number>;

  update: (productReviewId: string, doc: ProductReview, userId?: string) => Promise<ProductReview>

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
    addVote: (
      productReview: ProductReview,
      doc: ProductVote,
      userId?: string
    ) => Promise<ProductReview>;

    removeVote: (
      productReviewId: string,
      doc: ProductVote,
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
