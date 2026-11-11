import { log } from '@unchainedshop/logger';
import {
  UserNotFoundError,
  InvalidIdError,
  PasswordInvalidError,
  NoPermissionError,
} from '../../../errors.ts';
import type { Context } from '../../../context.ts';

export default async function setPassword(
  root: never,
  params: { newPassword: string; userId: string },
  { modules, userId }: Context,
) {
  const normalizedUserId = params.userId || userId;

  log(`mutation setPassword ${normalizedUserId}`, { userId });

  if (!normalizedUserId) throw new InvalidIdError({ userId: normalizedUserId });

  if (normalizedUserId === userId)
    throw new NoPermissionError({
      userId,
      message: 'Change your own password with changePassword or the password reset flow',
    });

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
