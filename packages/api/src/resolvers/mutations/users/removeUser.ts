import { log } from '@unchainedshop/logger';
import type { Context } from '../../../context.ts';
import { UserNotFoundError } from '../../../errors.ts';

export default async function removeUser(
  root: never,
  params: { userId: string; removeUserReviews?: boolean },
  unchainedAPI: Context,
) {
  const { modules, services, userId: currentUserId } = unchainedAPI;
  const { userId: paramUserId, removeUserReviews = false } = params;
  const normalizedUserId = paramUserId || currentUserId;

  log(`mutation removeUser ${normalizedUserId}`, { userId: currentUserId });

  if (!(await modules.users.userExists({ userId: normalizedUserId! })))
    throw new UserNotFoundError({ userId: normalizedUserId });

  if (removeUserReviews) {
    await modules.products.reviews.deleteByAuthorId(normalizedUserId!);
  }
  return services.users.deleteUser({ userId: normalizedUserId! });
}
