import type { Context } from '../../../../context.ts';
import type { Params } from '../schemas.ts';
import { getNormalizedUserDetails } from '../../../utils/getNormalizedUserDetails.ts';

export default async function addUserEmail(context: Context, params: Params<'ADD_EMAIL'>) {
  const { modules } = context;
  const { userId, email } = params;

  await modules.users.addEmail(userId || context.userId!, email);
  const user = await getNormalizedUserDetails(userId || context.userId!, context);
  return { user };
}
