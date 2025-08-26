import { Context } from '../../../../context.js';
import { Params } from '../schemas.js';
import { getNormalizedUserDetails } from '../../../utils/getNormalizedUserDetails.js';

export default async function updateUser(context: Context, params: Params<'UPDATE'>) {
  const { modules } = context;
  const { userId, profile, meta } = params;

  await modules.users.updateProfile(userId, { profile, meta } as any);
  return { user: await getNormalizedUserDetails(userId, context) };
}
