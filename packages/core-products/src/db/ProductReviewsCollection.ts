import { mongodb, buildDbIndexes } from '@unchainedshop/mongodb';
import { ProductReview } from '../types.js';

export const ProductReviewsCollection = async (db: mongodb.Db) => {
  const ProductReviews = db.collection<ProductReview>('product_reviews');

  await buildDbIndexes(ProductReviews, [
    { index: { productId: 1 } },
    { index: { authorId: 1 } },
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

  return {
    ProductReviews,
  };
};
