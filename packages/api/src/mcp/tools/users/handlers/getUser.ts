import { Context } from '../../../../context.js';
import { removeConfidentialServiceHashes } from '@unchainedshop/core-users';
import { Params } from '../schemas.js';

export default async function getUser(context: Context, params: Params<'GET'>) {
  const { modules } = context;
  const { userId } = params;

  if (!userId) {
    return { user: null };
  }
  const user = await modules.users.findUserById(userId);
  return { user: removeConfidentialServiceHashes(user) };
}
