import { log } from 'meteor/unchained:core-logger';
import { Products, ProductStatus } from 'meteor/unchained:core-products';

export default function (root, {
  limit = 10, offset = 0, tags, includeDrafts = false,
}, { userId }) {
  log(`query products: ${limit} ${offset} ${includeDrafts ? 'includeDrafts' : ''}`, { userId });
  const selector = { };
  if (tags && tags.length > 0) {
    selector.tags = { $in: tags };
  }
  if (!includeDrafts) {
    selector.status = { $eq: ProductStatus.ACTIVE };
  } else {
    selector.status = { $in: [ProductStatus.ACTIVE, ProductStatus.DRAFT] };
  }
  const sort = { published: -1 };
  const products = Products.find(selector, { skip: offset, limit, sort }).fetch();
  return products;
}
