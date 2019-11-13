import { ProductStatus } from 'meteor/unchained:core-products';

const defaultSelector = ({ includeInactive }) => {
  const selector = {
    status: { $in: [ProductStatus.ACTIVE, ProductStatus.DRAFT] }
  };
  if (!includeInactive) {
    selector.status = ProductStatus.ACTIVE;
  }
  return selector;
};

export default query => {
  const selector = defaultSelector(query);

  // TODO: Transform with Filter Plugin!

  return selector;
};
