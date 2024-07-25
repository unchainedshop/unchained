import { log } from '@unchainedshop/logger';
import { UserNotFoundError } from '../../../errors.js';
import { Context } from '../../../types.js';

export default async function sendEnrollmentEmail(
  root: never,
  { email }: { email: string },
  { modules, userId }: Context,
) {
  log('mutation sendEnrollmentEmail', { email, userId });

  const user = await modules.users.findUserByEmail(email);
  if (!user) throw new UserNotFoundError({ email });

  try {
    await modules.users.sendResetPasswordEmail(user._id, email, true);
    return {
      success: true,
    };
  } catch (e) {
    return {
      success: false,
    };
  }
}
