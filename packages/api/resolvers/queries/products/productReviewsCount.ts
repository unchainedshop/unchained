import { log } from 'meteor/unchained:logger';
import { Root, Context } from '@unchainedshop/types/api';

export default async function productReviewsCount(root: Root, _: never, { modules, userId }: Context) {
  log(`query productReviewsCount`, { userId });

  return modules.products.reviews.count({});
}
