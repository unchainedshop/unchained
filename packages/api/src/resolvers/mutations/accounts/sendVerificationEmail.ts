import { Context, Root } from '@unchainedshop/types/api.js';
import { log } from '@unchainedshop/logger';
import { UserNotFoundError } from '../../../errors.js';

export default async function sendVerificationEmail(
  root: Root,
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
  } catch (e) {
    return {
      success: false,
    };
  }
}
