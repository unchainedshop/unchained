import type { Filter } from 'mongodb';
import { SortOption } from './api.js';
import { TimestampFields } from './common.js';

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
  _id?: string;
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
  queryString?: string;
  created?: { end?: Date; start?: Date };
  updated?: { end?: Date; start?: Date };
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

  deleteMany: (selector: Filter<ProductReview>) => Promise<number>;

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
