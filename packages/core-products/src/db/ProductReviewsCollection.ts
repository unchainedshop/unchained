import { mongodb, buildDbIndexes, TimestampFields } from '@unchainedshop/mongodb';

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

export const ProductReviewsCollection = async (db: mongodb.Db) => {
  const ProductReviews = db.collection<ProductReview>('product_reviews');

  await buildDbIndexes(ProductReviews, [
    { index: { productId: 1 } },
    { index: { authorId: 1 } },
    // {
    //   index: {
    //     title: 'text',
    //     review: 'text',
    //   },
    //   options: {
    //     weights: {
    //       title: 3,
    //       review: 5,
    //     },
    //     name: 'productreview_fulltext_search',
    //   },
    // },
  ]);

  return {
    ProductReviews,
  };
};
