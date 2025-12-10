import {
  mongodb,
  buildDbIndexes,
  type TimestampFields,
  isDocumentDBCompatModeEnabled,
} from '@unchainedshop/mongodb';

export const ProductReviewVoteType = {
  UPVOTE: 'UPVOTE',
  DOWNVOTE: 'DOWNVOTE',
  REPORT: 'REPORT',
} as const;

export type ProductReviewVoteType = (typeof ProductReviewVoteType)[keyof typeof ProductReviewVoteType];

export interface ProductVote {
  meta?: any;
  timestamp?: Date;
  type: ProductReviewVoteType;
  userId?: string;
}

export type ProductReview = {
  _id: string;
  productId: string;
  authorId: string;
  rating: number;
  title?: string;
  review?: string;
  meta?: any;
  votes: ProductVote[];
} & TimestampFields;

export const ProductReviewsCollection = async (db: mongodb.Db) => {
  const ProductReviews = db.collection<ProductReview>('product_reviews');

  if (!isDocumentDBCompatModeEnabled()) {
    await buildDbIndexes(ProductReviews, [
      {
        index: {
          title: 'text',
          review: 'text',
        },
        options: {
          weights: {
            title: 3,
            review: 5,
          },
          name: 'productreview_fulltext_search',
        },
      },
    ]);
  }

  await buildDbIndexes(ProductReviews, [{ index: { productId: 1 } }, { index: { authorId: 1 } }]);

  return {
    ProductReviews,
  };
};
