import { log } from '@unchainedshop/logger';
import { UserNotFoundError } from '../../../errors.js';
import { Context } from '../../../context.js';

export default async function forgotPassword(
  root: never,
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
  } catch {
    return {
      success: false,
    };
  }
}
