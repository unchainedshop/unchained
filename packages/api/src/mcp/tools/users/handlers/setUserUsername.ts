import type { Context } from '../../../../context.ts';
import type { Params } from '../schemas.ts';
import { getNormalizedUserDetails } from '../../../utils/getNormalizedUserDetails.ts';

export default async function setUserUsername(context: Context, params: Params<'SET_USERNAME'>) {
  const { modules } = context;
  const { userId, username } = params;

  await modules.users.setUsername(userId, username);
  return { user: await getNormalizedUserDetails(userId, context) };
}
