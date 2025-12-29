import { log } from '@unchainedshop/logger';
import type { Context } from '../../../context.ts';
import { UserNotFoundError } from '../../../errors.ts';

// Note: This resolver is protected by the 'updateUser' ACL action (see mutations/index.ts)
// Logged-in users can only remove themselves (isMyself check in loggedIn.ts)
// Admin users can remove any user
export default async function removeUser(
  root: never,
  params: { userId: string; removeUserReviews?: boolean },
  { modules, services, userId: currentUserId }: Context,
) {
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
