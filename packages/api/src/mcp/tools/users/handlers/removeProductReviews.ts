import { Context } from '../../../../context.js';
import { Params } from '../schemas.js';

export default async function removeProductReviews(
  context: Context,
  params: Params<'REMOVE_PRODUCT_REVIEWS'>,
) {
  const { modules } = context;
  const { userId } = params;
  await modules.products.reviews.deleteMany({ authorId: userId });
  return { success: true };
}
