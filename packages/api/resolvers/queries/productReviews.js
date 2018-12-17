import { log } from 'meteor/unchained:core-logger';
import { ProductReviews } from 'meteor/unchained:core-products';

export default function (root, { limit = 10, offset = 0 }, { userId }) {
  log(`query productReviews: ${limit} ${offset}`, { userId });
  return ProductReviews.findReviews({}, { skip: offset, limit });
}
