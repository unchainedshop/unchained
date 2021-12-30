import { log } from 'meteor/unchained:logger';
import { InvalidIdError } from '../../../errors';
import { Root, Context } from '@unchainedshop/types/api';

export default async function productReview(
  root: Root,
  { productReviewId }: { productReviewId: string },
  { modules, userId }: Context
) {
  log(`query productReview ${productReviewId}`, { userId });

  if (!productReviewId) throw new InvalidIdError({ productReviewId });

  return await modules.products.reviews.findProductReview({ productReviewId });
}
