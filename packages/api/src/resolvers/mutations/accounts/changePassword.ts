import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api';
import { IncorrectPasswordError, InvalidCredentialsError } from '../../../errors';

export default async function changePassword(
  root: Root,
  params: {
    oldPlainPassword?: string;
    newPlainPassword?: string;
  },
  { modules, userId }: Context,
) {
  log('mutation changePassword', { userId });

  if (!params.newPlainPassword) {
    throw new Error('New password is required');
  }
  if (!params.oldPlainPassword) {
    throw new Error('Old password is required');
  }
  let success = false;
  try {
    success = await modules.accounts.changePassword(userId, params);
  } catch (e) {
    success = false;
    if (e.code === 'IncorrectPassword​') throw new IncorrectPasswordError({});
    else if (e.code === 'InvalidCredentials') throw new InvalidCredentialsError({});
    else throw e;
  }

  return { success };
}
