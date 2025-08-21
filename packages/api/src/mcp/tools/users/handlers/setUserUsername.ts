import { Context } from '../../../../context.js';
import { removeConfidentialServiceHashes } from '@unchainedshop/core-users';
import { Params } from '../schemas.js';

export default async function setUserUsername(context: Context, params: Params<'SET_USERNAME'>) {
  const { modules } = context;
  const { userId, username } = params;

  await modules.users.setUsername(userId, username);
  const user = await modules.users.findUserById(userId);
  return { user: removeConfidentialServiceHashes(user) };
}
