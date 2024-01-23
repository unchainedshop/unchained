import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api.js';
import { UserNotFoundError, InvalidIdError, PasswordInvalidError } from '../../../errors.js';

export default async function setPassword(
  root: Root,
  params: { newPassword: string; userId: string },
  { modules, userId }: Context,
) {
  const normalizedUserId = params.userId || userId;

  log(`mutation setPassword ${normalizedUserId}`, { userId });

  if (!normalizedUserId) throw new InvalidIdError({ userId: normalizedUserId });
  if (!params.newPassword) {
    throw new Error('Password is required');
  }
  if (!(await modules.users.userExists({ userId: normalizedUserId })))
    throw new UserNotFoundError({ userId: normalizedUserId });

  try {
    await modules.users.setPassword(normalizedUserId, params.newPassword);
  } catch (e) {
    if (e.cause === 'PASSWORD_INVALID') throw new PasswordInvalidError({ userId: normalizedUserId });
    else throw e;
  }

  return modules.users.findUserById(normalizedUserId);
}
