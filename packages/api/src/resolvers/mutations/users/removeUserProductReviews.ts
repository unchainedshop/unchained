import { log } from '@unchainedshop/logger';
import { InvalidIdError } from '../../../errors.js';
import { Context } from '../../../context.js';

export default async function removeUserProductReviews(
  root: never,
  params: {
    userId?: string;
  },
  { modules, userId: currentUserId }: Context,
) {
  const normalizedUserId = params?.userId || currentUserId;
  log(`mutation removeUserProductReviews ${normalizedUserId}`, {
    userId: currentUserId,
  });
  if (!normalizedUserId) throw new InvalidIdError({ userId: normalizedUserId });

  // Do not check for existance of user as the existance check would return false if the user is in status
  // 'deleted' and we still want to remove the reviews in that case
  await modules.products.reviews.deleteMany({ authorId: normalizedUserId });

  return true;
}
