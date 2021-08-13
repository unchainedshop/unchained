import runProductMediaMigrations from './product-media/schema';
import runProductReviewsMigrations from './product-reviews/schema';
import runProductVariationsMigrations from './product-variations/schema';
import runProductsMigrations from './products/schema';

export default () => {
  runProductMediaMigrations();
  runProductReviewsMigrations();
  runProductVariationsMigrations();
  runProductsMigrations();
};
