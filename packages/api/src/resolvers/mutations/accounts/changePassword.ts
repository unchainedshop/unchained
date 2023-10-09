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
  let success = false;
  try {
    success = await modules.accounts.changePassword(userId, params);
  } catch (e) {
    success = false;
    if (e.code === 'InvalidCredentials') throw new InvalidCredentialsError({});
    else throw new AuthOperationFailedError({});
  }

  return { success };
}
