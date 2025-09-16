import { useIntl } from 'react-intl';
import NoData from '../../common/components/NoData';
import ProductReviewsItem from './ProductReviewsItem';

const ProductReviewsList = ({
  reviews,
  className = '',
  enableDelete = false,
  showProduct = false,
}) => {
  const { formatMessage } = useIntl();
  if (!reviews || !reviews.length)
    return (
      <NoData
        message={formatMessage({ id: 'reviews', defaultMessage: 'Reviews' })}
      />
    );

  return (
    <div className={`${className || ''} `}>
      {reviews.map((review) => (
        <ProductReviewsItem
          showProduct={showProduct}
          key={review._id}
          review={review}
          enableDelete={enableDelete}
        />
      ))}
    </div>
  );
};

export default ProductReviewsList;
