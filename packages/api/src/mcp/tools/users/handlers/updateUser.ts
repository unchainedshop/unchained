import { Context } from '../../../../context.js';
import { removeConfidentialServiceHashes } from '@unchainedshop/core-users';
import { Params } from '../schemas.js';

export default async function updateUser(context: Context, params: Params<'UPDATE'>) {
  const { modules } = context;
  const { userId, profile, meta } = params;

  const user = await modules.users.updateProfile(userId, { profile, meta });
  return { user: removeConfidentialServiceHashes(user) };
}
