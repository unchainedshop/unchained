import { log } from '@unchainedshop/logger';
import { Context } from '../../../context.js';
import { UserNotFoundError } from '../../../errors.js';

export default async function removeUser(
  root: never,
  params: { userId: string; removeUserReviews?: boolean },
  unchainedAPI: Context,
) {
  const { modules, services, userId } = unchainedAPI;
  const { userId: paramUserId, removeUserReviews = false } = params;
  const normalizedUserId = paramUserId || userId;

  log(`mutation removeUser ${normalizedUserId}`, { userId });

  if (!(await modules.users.userExists({ userId: normalizedUserId })))
    throw new UserNotFoundError({ userId: normalizedUserId });

  if (removeUserReviews) {
    await modules.products.reviews.deleteMany({ authorId: userId });
  }
  return services.users.deleteUser({ userId: normalizedUserId });
}
