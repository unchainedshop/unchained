import { log } from 'unchained-logger';
import { Products } from 'meteor/unchained:core-products';

export default function productsCount(
  root,
  { tags, includeDrafts, slugs },
  { userId }
) {
  log(
    `query productsCount:  ${
      includeDrafts ? 'includeDrafts' : ''
    } ${slugs?.join(',')}`,
    { userId }
  );
  return Products.count({ tags, includeDrafts, slugs });
}
