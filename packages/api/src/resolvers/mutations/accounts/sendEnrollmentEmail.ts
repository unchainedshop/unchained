import { log } from '@unchainedshop/logger';
import { UserNotFoundError } from '../../../errors.ts';
import type { Context } from '../../../context.ts';

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
  } catch {
    return {
      success: false,
    };
  }
}
