import { log } from '@unchainedshop/logger';
import { UserProfile } from '@unchainedshop/types/user.js';
import { Context } from '../../../types.js';
import { UserNotFoundError } from '../../../errors.js';

export default async function updateUserProfile(
  root: never,
  params: { profile: UserProfile; meta?: any; userId: string },
  { modules, userId }: Context,
) {
  const { userId: paramUserId, ...profile } = params;
  const normalizedUserId = paramUserId || userId;

  log(`mutation updateUserProfile ${normalizedUserId}`, { userId });

  if (!(await modules.users.userExists({ userId: normalizedUserId })))
    throw UserNotFoundError({ id: normalizedUserId });

  return modules.users.updateProfile(normalizedUserId, profile);
}
