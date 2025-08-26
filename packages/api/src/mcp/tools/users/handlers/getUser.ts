import { Context } from '../../../../context.js';
import { Params } from '../schemas.js';
import { getNormalizedUserDetails } from '../../../utils/getNormalizedUserDetails.js';

export default async function getUser(context: Context, params: Params<'GET'>) {
  const { userId } = params;

  if (!userId) {
    return { user: null };
  }
  const user = await getNormalizedUserDetails(userId, context);
  return { user };
}
