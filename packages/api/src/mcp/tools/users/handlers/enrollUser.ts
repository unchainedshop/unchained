import { Context } from '../../../../context.js';
import { removeConfidentialServiceHashes } from '@unchainedshop/core-users';
import { Params } from '../schemas.js';

export default async function enrollUser(context: Context, params: Params<'ENROLL'>) {
  const { modules } = context;
  const { email, profile, password } = params;

  const userId = await modules.users.createUser({
    email,
    password,
    ...profile,
  });

  if (!password) {
    await modules.users.sendResetPasswordEmail(userId, email, true);
  }

  const user = await modules.users.findUserById(userId);
  return { user: removeConfidentialServiceHashes(user) };
}
