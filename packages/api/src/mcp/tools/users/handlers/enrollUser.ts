import { Context } from '../../../../context.js';
import { Params } from '../schemas.js';
import { getNormalizedUserDetails } from '../../../utils/getNormalizedUserDetails.js';

export default async function enrollUser(context: Context, params: Params<'ENROLL'>) {
  const { modules } = context;
  const { email, profile, password } = params;

  const userId = await modules.users.createUser({
    email,
    password: password || null,
    ...profile,
  });

  if (!password) {
    await modules.users.sendResetPasswordEmail(userId, email, true);
  }
  return { user: await getNormalizedUserDetails(userId, context) };
}
