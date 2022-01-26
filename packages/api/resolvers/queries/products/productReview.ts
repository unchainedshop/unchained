import { log } from 'meteor/unchained:logger';
import { Root, Context } from '@unchainedshop/types/api';
import { InvalidIdError } from '../../../errors';

export default async function productReview(
  root: Root,
  { productReviewId }: { productReviewId: string },
  { modules, userId }: Context
) {
  log(`query productReview ${productReviewId}`, { userId });

  if (!productReviewId) throw new InvalidIdError({ productReviewId });

  return modules.products.reviews.findProductReview({ productReviewId });
}
