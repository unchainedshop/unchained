import { Context } from '../../../../context.js';
import { removeConfidentialServiceHashes } from '@unchainedshop/core-users';
import { Params } from '../schemas.js';

export default async function addUserEmail(context: Context, params: Params<'ADD_EMAIL'>) {
  const { modules } = context;
  const { userId, email } = params;

  await modules.users.addEmail(userId, email);
  const user = await modules.users.findUserById(userId);
  return { user: removeConfidentialServiceHashes(user) };
}
