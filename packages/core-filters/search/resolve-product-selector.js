import { ProductStatus } from 'meteor/unchained:core-products';
import { FilterDirector } from 'meteor/unchained:core-filters';

const defaultSelector = ({ includeInactive }) => {
  const selector = {
    status: { $in: [ProductStatus.ACTIVE, null /* ProductStatus.DRAFT */] },
  };
  if (!includeInactive) {
    selector.status = ProductStatus.ACTIVE;
  }
  return selector;
};

export default async (query, options = {}) => {
  const selector = defaultSelector(query);
  const director = new FilterDirector({ query, ...options });
  return director.buildProductSelector(selector);
};
