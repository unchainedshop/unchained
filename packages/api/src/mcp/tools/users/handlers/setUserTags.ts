import type { Context } from '../../../../context.ts';
import type { Params } from '../schemas.ts';
import { getNormalizedUserDetails } from '../../../utils/getNormalizedUserDetails.ts';

export default async function setUserTags(context: Context, params: Params<'SET_TAGS'>) {
  const { modules } = context;
  const { userId, tags } = params;

  await modules.users.updateTags(userId, tags);
  return { user: await getNormalizedUserDetails(userId, context) };
}
