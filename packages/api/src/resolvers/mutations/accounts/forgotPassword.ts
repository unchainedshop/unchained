import { log } from '@unchainedshop/logger';
import type { Context } from '../../../context.ts';

export default async function forgotPassword(
  root: never,
  { email }: { email: string },
  { modules, userId }: Context,
) {
  // Don't log email to avoid PII in logs
  log('mutation forgotPassword', { userId });

  const user = await modules.users.findUserByEmail(email);

  // Always return success to prevent user enumeration attacks
  // If user doesn't exist, we silently succeed without sending email
  if (!user) {
    return { success: true };
  }

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
