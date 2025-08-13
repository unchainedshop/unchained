import { Context } from '../../../../context.js';
import { removeConfidentialServiceHashes } from '@unchainedshop/core-users';
import { Params } from '../schemas.js';

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
  });

  return { users: users.map(removeConfidentialServiceHashes) };
}
