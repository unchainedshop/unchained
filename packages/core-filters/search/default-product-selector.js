import { ProductStatus } from 'meteor/unchained:core-products';

export default ({ includeInactive }) => {
  const selector = {
    status: { $in: [ProductStatus.ACTIVE, ProductStatus.DRAFT] }
  };
  if (!includeInactive) {
    selector.status = ProductStatus.ACTIVE;
  }
  return selector;
};
