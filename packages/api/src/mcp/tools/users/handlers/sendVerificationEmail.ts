import { Context } from '../../../../context.js';
import { Params } from '../schemas.js';

export default async function sendVerificationEmail(
  context: Context,
  params: Params<'SEND_VERIFICATION_EMAIL'>,
) {
  const { modules } = context;
  const { email } = params;
  const targetEmail = email || context.user?.emails?.[0]?.address;
  if (!targetEmail) {
    throw new Error('No email provided or user has no email');
  }
  const user = await modules.users.findUserByEmail(targetEmail);
  if (user) {
    await modules.users.sendVerificationEmail(user._id, targetEmail);
  }
  return { success: !!user };
}
