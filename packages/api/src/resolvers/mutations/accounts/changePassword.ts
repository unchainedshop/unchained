import { log } from '@unchainedshop/logger';
import { InvalidCredentialsError, PasswordInvalidError } from '../../../errors.ts';
import type { Context } from '../../../context.ts';

export default async function changePassword(
  root: never,
  params: {
    oldPassword: string;
    newPassword: string;
  },
  context: Context,
) {
  const { modules, userId } = context;

  log('mutation changePassword', { userId });

  const user = await modules.users.findUserById(userId!);

  const isValidCurrentPassword =
    user!.services?.password &&
    (await modules.users.verifyPassword(user!.services?.password, params.oldPassword));
  if (!isValidCurrentPassword) throw new InvalidCredentialsError({});

  try {
    await modules.users.setPassword(user!._id, params.newPassword);
  } catch (e) {
    if (e.cause === 'PASSWORD_INVALID') throw new PasswordInvalidError({ userId });
    else throw e;
  }

  // setPassword ends every session established with the old password, including this
  // one, so the caller gets a fresh session instead of being signed out.
  await context.login(user!);

  return { success: true };
}
