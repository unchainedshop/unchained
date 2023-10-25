import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api.js';
import { UserNotFoundError } from '../../../errors.js';

export default async function sendEnrollmentEmail(
  root: Root,
  { email }: { email: string },
  { modules, userId }: Context,
) {
  log('mutation sendEnrollmentEmail', { email, userId });

  const user = await modules.users.findUserByEmail(email);
  if (!user) throw new UserNotFoundError({ email });

  try {
    await modules.users.sendEnrollmentEmail(user._id, email);
    return {
      success: true,
    };
  } catch (e) {
    return {
      success: false,
    };
  }
}
