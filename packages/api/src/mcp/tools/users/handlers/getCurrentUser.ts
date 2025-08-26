import { Context } from '../../../../context.js';
import { getNormalizedUserDetails } from '../../../utils/getNormalizedUserDetails.js';

export default async function getCurrentUser(context: Context) {
  const { userId } = context;
  return { user: await getNormalizedUserDetails(userId, context) };
}
