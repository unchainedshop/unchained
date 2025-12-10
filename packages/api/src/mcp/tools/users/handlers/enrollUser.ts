import type { Context } from '../../../../context.ts';
import type { Params } from '../schemas.ts';
import { getNormalizedUserDetails } from '../../../utils/getNormalizedUserDetails.ts';

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
