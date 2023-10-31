/* eslint-disable no-case-declarations */
import { RemoveUserTracesProductService } from '@unchainedshop/types/products.js';

export const removeUserTracesProductService: RemoveUserTracesProductService = async (
  { userId },
  unchainedAPI,
) => {
  const { modules } = unchainedAPI;

  await modules.bookmarks.deleteByUserId(userId);
  await modules.products.reviews.removeUserReviews(userId);
  return true;
};
