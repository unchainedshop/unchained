import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api';
import { UserQuery } from '@unchainedshop/types/user';

export default async function usersCount(root: Root, params: UserQuery, { modules, userId }: Context) {
  log(`query usersCount ${params.queryString || ''} ${params.includeGuests ? 'includeGuests' : ''}`, {
    userId,
  });

  return modules.users.count(params);
}
