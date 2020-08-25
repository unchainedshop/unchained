import { log } from 'meteor/unchained:core-logger';
import { Products, ProductStatus } from 'meteor/unchained:core-products';

export default function products(
  root,
  { limit, offset, tags, includeDrafts, slugs },
  { userId },
) {
  log(
    `query products: ${limit} ${offset} ${
      includeDrafts ? 'includeDrafts' : ''
    } ${slugs?.join(',')}`,
    { userId },
  );

  const selector = {};
  const sort = { sequence: 1, published: -1 };
  const options = { sort };

  if (slugs?.length > 0) {
    selector.slugs = { $in: slugs };
  } else {
    options.skip = offset;
    options.limit = limit;

    if (tags?.length > 0) {
      selector.tags = { $all: tags };
    }
  }

  if (!includeDrafts) {
    selector.status = { $eq: ProductStatus.ACTIVE };
  } else {
    selector.status = { $in: [ProductStatus.ACTIVE, ProductStatus.DRAFT] };
  }
  return Products.find(selector, options).fetch();
}
