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

  let updatedUser;
  try {
    updatedUser = await modules.users.setPassword(user!._id, params.newPassword);
  } catch (e) {
    if (e.cause === 'PASSWORD_INVALID') throw new PasswordInvalidError({ userId });
    throw e;
  }

  await context.login(updatedUser);

  return { success: true };
}
