import { log } from 'meteor/unchained:logger';
import { Products } from 'meteor/unchained:core-products';

export default function products(
  root,
  { limit, offset, tags, includeDrafts, slugs },
  { userId }
) {
  log(
    `query products: ${limit} ${offset} ${
      includeDrafts ? 'includeDrafts' : ''
    } ${slugs?.join(',')}`,
    { userId }
  );
  return Products.findProducts({ limit, offset, tags, includeDrafts, slugs });
}
