import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api.js';
import { UserNotFoundError } from '../../../errors.js';

export default async function forgotPassword(
  root: Root,
  { email }: { email: string },
  { modules, userId }: Context,
) {
  log('mutation forgotPassword', { email, userId });

  const user = await modules.users.findUserByEmail(email);
  if (!user) throw new UserNotFoundError({ email });

  try {
    await modules.users.sendResetPasswordEmail(user._id, email);
    return {
      success: true,
    };
  } catch (e) {
    return {
      success: false,
    };
  }
}
