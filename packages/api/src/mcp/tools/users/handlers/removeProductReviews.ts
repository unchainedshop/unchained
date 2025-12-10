import type { Context } from '../../../../context.ts';
import type { Params } from '../schemas.ts';

export default async function removeProductReviews(
  context: Context,
  params: Params<'REMOVE_PRODUCT_REVIEWS'>,
) {
  const { modules } = context;
  const { userId } = params;
  await modules.products.reviews.deleteMany({ authorId: userId });
  return { success: true };
}
