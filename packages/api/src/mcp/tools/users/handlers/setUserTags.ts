import { Context } from '../../../../context.js';
import { Params } from '../schemas.js';
import { getNormalizedUserDetails } from '../../../utils/getNormalizedUserDetails.js';

export default async function setUserTags(context: Context, params: Params<'SET_TAGS'>) {
  const { modules } = context;
  const { userId, tags } = params;

  await modules.users.updateTags(userId, tags);
  return { user: await getNormalizedUserDetails(userId, context) };
}
