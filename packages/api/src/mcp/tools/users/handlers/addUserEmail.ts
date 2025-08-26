import { Context } from '../../../../context.js';
import { Params } from '../schemas.js';
import { getNormalizedUserDetails } from '../../../utils/getNormalizedUserDetails.js';

export default async function addUserEmail(context: Context, params: Params<'ADD_EMAIL'>) {
  const { modules } = context;
  const { userId, email } = params;

  await modules.users.addEmail(userId, email);
  const user = await getNormalizedUserDetails(userId, context);
  return { user };
}
