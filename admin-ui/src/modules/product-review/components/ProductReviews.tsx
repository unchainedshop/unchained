import { useIntl } from 'react-intl';
import useProductReviewsByProductId from '../hooks/useProductReviewsByProductId';
import ProductReviewsItem from './ProductReviewsItem';
import ProductReviewsReport from './ProductReviewsReport';
import ProductReviewForm from './ProductReviewForm';
import useCreateProductReview from '../hooks/useCreateProductReview';
import Button from '../../common/components/Button';

const ProductReviews = ({ productId }) => {
  const { productReviews, loadMore, reviewsCount } =
    useProductReviewsByProductId({
      productId,
    });
  const { createProductReview } = useCreateProductReview();
  const { formatMessage } = useIntl();

  return (
    <div className="sm:max-w-full">
      <div className="text-slate-900 dark:text-slate-200">
        <div className="mx-auto p-2 lg:grid lg:max-w-7xl lg:grid-cols-12 lg:gap-x-8">
          <ProductReviewsReport productReviews={productReviews} />

          <div className="mt-16 lg:col-span-7 lg:col-start-6 lg:mt-0">
            {productId && (
              <ProductReviewForm
                onSubmit={async ({ title, review, rating }) =>
                  await createProductReview({
                    productId,
                    productReview: {
                      title,
                      review,
                      rating: 10,
                    },
                  })
                }
              />
            )}
            <h3 className="sr-only">
              {formatMessage({
                id: 'recent_reviews',
                defaultMessage: 'Recent reviews',
              })}
            </h3>

            <div className="flow-root">
              <div className="-my-3">
                {productReviews.map((review) => (
                  <ProductReviewsItem key={review._id} review={review} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {reviewsCount > productReviews?.length ? (
        <Button
          text={formatMessage({
            id: 'load-more-reviews',
            defaultMessage: 'Load reviews',
          })}
          onClick={loadMore}
        />
      ) : null}
    </div>
  );
};

export default ProductReviews;
