import { log } from 'meteor/unchained:logger';
import { UserProfile } from '@unchainedshop/types/user';
import { Context, Root } from '@unchainedshop/types/api';
import { UserNotFoundError } from '../../../errors';

export default async function updateUserProfile(
  root: Root,
  params: { profile: UserProfile; meta?: any; userId: string },
  { modules, userId }: Context,
) {
  const { userId: paramUserId, ...profile } = params;
  const normalizedUserId = paramUserId || userId;

  log(`mutation updateUserProfile ${normalizedUserId}`, { userId });

  if (!(await modules.users.userExists({ userId: normalizedUserId })))
    throw UserNotFoundError({ id: normalizedUserId });

  return modules.users.updateProfile(normalizedUserId, profile, userId);
}
