import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api.js';
import { AuthOperationFailedError, InvalidCredentialsError } from '../../../errors.js';

export default async function changePassword(
  root: Root,
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

  const isValidCurrentPassword = await modules.users.verifyPassword(userId, params.oldPassword);
  if (!isValidCurrentPassword) throw new InvalidCredentialsError({});

  let success = false;
  try {
    await modules.users.setPassword(userId, params.newPassword);
    success = true;
  } catch (e) {
    success = false;
    throw new AuthOperationFailedError({});
  }

  return { success };
}
