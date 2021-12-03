import { log } from 'meteor/unchained:logger';
import { ProductReviews } from 'meteor/unchained:core-products';

export default async function productReviews(
  root,
  { limit, offset, sort, queryString },
  { userId }
) {
  log(`query productReviews: ${limit} ${offset} ${queryString || ''}`, {
    userId,
  });
  return ProductReviews.findReviews(
    { queryString },
    { skip: offset, limit, sort }
  );
}
