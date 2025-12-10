import { log } from '@unchainedshop/logger';
import type { Context } from '../../../context.ts';
import type { UserQuery } from '@unchainedshop/core-users';

export default async function usersCount(root: never, params: UserQuery, { modules, userId }: Context) {
  log(`query usersCount ${params.queryString || ''} ${params.includeGuests ? 'includeGuests' : ''}`, {
    userId,
  });

  return modules.users.count(params);
}
