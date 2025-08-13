import { Context } from '../../../../context.js';
import { Params } from '../schemas.js';

export default async function countUsers(context: Context, params: Params<'COUNT'>) {
  const { modules } = context;
  const { includeGuests = false, queryString, emailVerified, lastLogin } = params;

  const count = await modules.users.count({
    includeGuests,
    queryString,
    emailVerified,
    lastLogin,
  });

  return { count };
}
