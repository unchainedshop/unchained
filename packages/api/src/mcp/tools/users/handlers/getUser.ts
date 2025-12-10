import type { Context } from '../../../../context.ts';
import type { Params } from '../schemas.ts';
import { getNormalizedUserDetails } from '../../../utils/getNormalizedUserDetails.ts';

export default async function getUser(context: Context, params: Params<'GET'>) {
  const { userId } = params;

  if (!userId) {
    return { user: null };
  }
  const user = await getNormalizedUserDetails(userId, context);
  return { user };
}
