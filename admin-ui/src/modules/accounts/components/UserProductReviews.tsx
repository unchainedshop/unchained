import useUserProductReviews from '../../product-review/hooks/useUserProductReviews';
import ProductReviewsList from '../../product-review/components/ProductReviewsList';
import Button from '../../common/components/Button';
import { useIntl } from 'react-intl';

const UserProductReviews = ({ _id }) => {
  const { formatMessage } = useIntl();
  const { reviews, loadMore, reviewsCount } = useUserProductReviews({
    userId: _id,
  });

  return (
    <div className="space-y-4 mt-4">
      <ProductReviewsList
        reviews={reviews}
        enableDelete={true}
        showProduct={true}
      />
      {reviewsCount > reviews?.length ? (
        <Button
          text={formatMessage({
            id: 'load-more-reviews',
            defaultMessage: 'Load reviews',
          })}
          className=""
          onClick={loadMore}
        />
      ) : null}
    </div>
  );
};

export default UserProductReviews;
