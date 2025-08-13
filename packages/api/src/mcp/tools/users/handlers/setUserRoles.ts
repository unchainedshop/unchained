import { Context } from '../../../../context.js';
import { removeConfidentialServiceHashes } from '@unchainedshop/core-users';
import { Params } from '../schemas.js';

export default async function setUserRoles(context: Context, params: Params<'SET_ROLES'>) {
  const { modules } = context;
  const { userId, roles } = params;
  await modules.users.updateRoles(userId, roles);

  const user = await modules.users.findUserById(userId);
  return { user: removeConfidentialServiceHashes(user) };
}
