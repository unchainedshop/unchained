import { log } from '@unchainedshop/logger';
import type { Context } from '../../../context.ts';
import type { UserQuery } from '@unchainedshop/core-users';

export default async function usersCount(
  root: never,
  params: UserQuery & { queryString?: string },
  { services, userId }: Context,
) {
  log(`query usersCount ${params.includeGuests ? 'includeGuests' : ''}`, {
    userId,
  });

  const { queryString, ...query } = params;

  return services.users.searchUsersCount(queryString, query);
}
