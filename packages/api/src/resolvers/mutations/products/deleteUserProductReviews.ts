import { log } from '@unchainedshop/logger';
import { InvalidIdError, UserNotFoundError } from '../../../errors.js';
import { Context } from '../../../context.js';

export default async function deleteUserProductReviews(
  root: never,
  params: {
    userId?: string;
  },
  { modules, userId: currentUserId }: Context,
) {
  const normalizedUserId = params?.userId || currentUserId;
  log(`mutation deleteUserProductReviews ${normalizedUserId}`, {
    userId: currentUserId,
  });
  if (!normalizedUserId) throw new InvalidIdError({ userId: normalizedUserId });
  if (!(await modules.users.userExists({ userId: normalizedUserId })))
    throw new UserNotFoundError({ userId: normalizedUserId });
  await modules.products.reviews.deleteMany({ authorId: normalizedUserId });

  return true;
}
