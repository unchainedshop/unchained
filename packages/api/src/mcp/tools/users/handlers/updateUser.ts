import type { Context } from '../../../../context.ts';
import type { Params } from '../schemas.ts';
import { getNormalizedUserDetails } from '../../../utils/getNormalizedUserDetails.ts';

export default async function updateUser(context: Context, params: Params<'UPDATE'>) {
  const { modules } = context;
  const { userId, profile, meta } = params;

  await modules.users.updateProfile(userId, { profile, meta } as any);
  return { user: await getNormalizedUserDetails(userId, context) };
}
