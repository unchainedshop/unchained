import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api';
import { UserNotFoundError, InvalidIdError } from '../../../errors';

export default async function setPassword(
  root: Root,
  params: { newPassword: string; newPlainPassword: string; userId: string },
  { modules, userId }: Context,
) {
  const normalizedUserId = params.userId || userId;

  log(`mutation setPassword ${normalizedUserId}`, { userId });

  if (!normalizedUserId) throw new InvalidIdError({ userId: normalizedUserId });
  if (!params.newPassword && !params.newPlainPassword) {
    throw new Error('Password is required');
  }
  if (!(await modules.users.userExists({ userId: normalizedUserId })))
    throw new UserNotFoundError({ userId: normalizedUserId });

  await modules.accounts.setPassword(normalizedUserId, params);

  return modules.users.findUserById(normalizedUserId);
}
