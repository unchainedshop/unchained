import { ProductStatus } from 'meteor/unchained:core-products';
import { FilterDirector } from 'meteor/unchained:core-filters';

const defaultSelector = ({ includeInactive }) => {
  const selector = {
    status: { $in: [ProductStatus.ACTIVE, ProductStatus.DRAFT] }
  };
  if (!includeInactive) {
    selector.status = ProductStatus.ACTIVE;
  }
  return selector;
};

export default async query => {
  const selector = defaultSelector(query);
  const director = new FilterDirector({ query });
  return director.buildProductSelector(selector);
};
