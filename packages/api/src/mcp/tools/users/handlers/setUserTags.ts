import { Context } from '../../../../context.js';
import { removeConfidentialServiceHashes } from '@unchainedshop/core-users';
import { Params } from '../schemas.js';

export default async function setUserTags(context: Context, params: Params<'SET_TAGS'>) {
  const { modules } = context;
  const { userId, tags } = params;

  await modules.users.updateTags(userId, tags);
  const user = await modules.users.findUserById(userId);
  return { user: removeConfidentialServiceHashes(user) };
}
