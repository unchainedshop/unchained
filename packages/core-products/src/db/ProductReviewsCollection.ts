import { ProductReview } from '@unchainedshop/types/products.reviews';
import { Db } from '@unchainedshop/types/common';
import { buildDbIndexes } from 'meteor/unchained:utils';

export const ProductReviewsCollection = async (db: Db) => {
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
