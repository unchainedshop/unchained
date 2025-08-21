import { Context } from '../../../../context.js';
import { Params } from '../schemas.js';

export default async function sendEnrollmentEmail(
  context: Context,
  params: Params<'SEND_ENROLLMENT_EMAIL'>,
) {
  const { modules } = context;
  const { email } = params;
  const user = await modules.users.findUserByEmail(email);
  if (user) {
    await modules.users.sendResetPasswordEmail(user._id, email, true);
  }
  return { success: !!user };
}
