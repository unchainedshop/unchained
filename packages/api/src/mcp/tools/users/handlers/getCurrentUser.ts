import type { Context } from '../../../../context.ts';
import { getNormalizedUserDetails } from '../../../utils/getNormalizedUserDetails.ts';

export default async function getCurrentUser(context: Context) {
  const { userId } = context;
  return { user: await getNormalizedUserDetails(userId!, context) };
}
