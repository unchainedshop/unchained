import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api';
import { UserNotFoundError } from '../../../errors';

export default async function forgotPassword(
  root: Root,
  { email }: { email: string },
  { modules, userId }: Context,
) {
  log('mutation forgotPassword', { email, userId });

  let success = false;
  try {
    success = await modules.accounts.sendResetPasswordEmail(email);
  } catch (e) {
    if (e.code === 'UserNotFound') throw new UserNotFoundError({ email });
    throw e;
  }

  return { success };
}
