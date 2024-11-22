import { log } from '@unchainedshop/logger';
import { InvalidCredentialsError, PasswordInvalidError } from '../../../errors.js';
import { Context } from '../../../context.js';

export default async function changePassword(
  root: never,
  params: {
    oldPassword?: string;
    newPassword?: string;
  },
  { modules, userId }: Context,
) {
  log('mutation changePassword', { userId });

  if (!params.newPassword) {
    throw new Error('New password is required');
  }
  if (!params.oldPassword) {
    throw new Error('Old password is required');
  }

  const user = await modules.users.findUserById(userId);

  const isValidCurrentPassword =
    user.services?.password &&
    (await modules.users.verifyPassword(user.services?.password, params.oldPassword));
  if (!isValidCurrentPassword) throw new InvalidCredentialsError({});

  let success = false;

  try {
    await modules.users.setPassword(user._id, params.newPassword);
    success = true;
  } catch (e) {
    success = false;
    if (e.cause === 'PASSWORD_INVALID') throw new PasswordInvalidError({ userId });
    else throw e;
  }

  return { success };
}
