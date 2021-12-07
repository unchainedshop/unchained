import { log } from 'meteor/unchained:logger';
import { Context, Root } from '@unchainedshop/types/api';
import { UserNotFoundError, InvalidIdError } from '../../../errors';

export default async function setPassword(
  root: Root,
  params: { newPassword: string; newPlainPassword: string; userId: string },
  { modules, userId }: Context
) {
  const normalizedUserId = params.userId || userId;

  log(`mutation setPassword ${normalizedUserId}`, { userId });

  if (!normalizedUserId) throw new InvalidIdError({ userId: normalizedUserId });
  if (!params.newPassword && !params.newPlainPassword) {
    throw new Error('Password is required');
  }
  const user = await modules.users.findUser({ userId: normalizedUserId });
  if (!user) throw new UserNotFoundError({ userId });

  await modules.accounts.setPassword(userId, params);

  return user;
}
