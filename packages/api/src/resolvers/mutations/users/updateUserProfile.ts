import { log } from '@unchainedshop/logger';
import type { UserProfile } from '@unchainedshop/core-users';
import type { Context } from '../../../context.ts';
import { UserNotFoundError } from '../../../errors.ts';

export default async function updateUserProfile(
  root: never,
  params: { profile: UserProfile; meta?: any; userId: string },
  { modules, userId }: Context,
) {
  const { userId: paramUserId, ...profile } = params;
  const normalizedUserId = paramUserId || userId;

  log(`mutation updateUserProfile ${normalizedUserId}`, { userId });

  if (!(await modules.users.userExists({ userId: normalizedUserId! })))
    throw UserNotFoundError({ userId: normalizedUserId });

  return modules.users.updateProfile(normalizedUserId!, profile);
}
