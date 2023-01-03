import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api.js';
import { AuthOperationFailedError, UserNotFoundError } from '../../../errors.js';

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
    else throw new AuthOperationFailedError({ email });
  }

  return { success };
}
