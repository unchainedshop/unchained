import { Context } from '../../../../context.js';
import { Params } from '../schemas.js';
import { getNormalizedUserDetails } from '../../../utils/getNormalizedUserDetails.js';

export default async function setUserUsername(context: Context, params: Params<'SET_USERNAME'>) {
  const { modules } = context;
  const { userId, username } = params;

  await modules.users.setUsername(userId, username);
  return { user: await getNormalizedUserDetails(userId, context) };
}
