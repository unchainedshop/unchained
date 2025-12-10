import type { Context } from '../../../../context.ts';
import type { Params } from '../schemas.ts';
import { getNormalizedUserDetails } from '../../../utils/getNormalizedUserDetails.ts';

export default async function listUsers(context: Context, params: Params<'LIST'>) {
  const { modules } = context;
  const {
    limit = 20,
    offset = 0,
    includeGuests = false,
    queryString,
    sort,
    emailVerified,
    lastLogin,
  } = params;

  const users = await modules.users.findUsers({
    includeGuests,
    queryString,
    emailVerified,
    lastLogin,
    limit,
    offset,
    sort,
  } as any);
  return {
    users: await Promise.all(users.map(async ({ _id }) => getNormalizedUserDetails(_id, context))),
  };
}
