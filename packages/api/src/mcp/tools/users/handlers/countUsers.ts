import type { Context } from '../../../../context.ts';
import type { Params } from '../schemas.ts';

export default async function countUsers(context: Context, params: Params<'COUNT'>) {
  const { modules } = context;
  const { includeGuests = false, emailVerified, lastLogin } = params;

  const count = await modules.users.count({
    includeGuests,
    emailVerified,
    lastLogin,
  });

  return { count };
}
