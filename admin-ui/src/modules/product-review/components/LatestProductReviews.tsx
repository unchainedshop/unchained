import useProductReviews from '../../product/hooks/useProductReviews';
import ProductReviewsList from './ProductReviewsList';

const LatestProductReviews = () => {
  const { reviews } = useProductReviews();

  return <ProductReviewsList className="bg-white" reviews={reviews} />;
};

export default LatestProductReviews;
