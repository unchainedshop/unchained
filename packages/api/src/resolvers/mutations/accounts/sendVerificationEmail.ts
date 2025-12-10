import { log } from '@unchainedshop/logger';
import { UserNotFoundError } from '../../../errors.ts';
import type { Context } from '../../../context.ts';

export default async function sendVerificationEmail(
  root: never,
  { email }: { email: string },
  { modules, userId }: Context,
) {
  log('mutation sendVerificationEmail', { email, userId });

  const user = await modules.users.findUserByEmail(email);
  if (!user) throw new UserNotFoundError({ email });

  try {
    await modules.users.sendVerificationEmail(user._id, email);
    return {
      success: true,
    };
  } catch {
    return {
      success: false,
    };
  }
}
