import { Context } from '../../../../context.js';
import { removeConfidentialServiceHashes } from '@unchainedshop/core-users';
import { Params } from '../schemas.js';

export default async function setUserPassword(context: Context, params: Params<'SET_PASSWORD'>) {
  const { modules } = context;
  const { userId, newPassword } = params;

  await modules.users.setPassword(userId, newPassword);
  const user = await modules.users.findUserById(userId);
  return { user: removeConfidentialServiceHashes(user) };
}
