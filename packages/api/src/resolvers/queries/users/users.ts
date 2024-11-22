import { log } from '@unchainedshop/logger';
import { SortOption } from '@unchainedshop/utils';
import { UserQuery } from '@unchainedshop/core-users';
import { Context } from '../../../context.js';

export default async function users(
  root: never,
  params: UserQuery & {
    limit?: number;
    offset?: number;
    sort?: Array<SortOption>;
  },
  { modules, userId }: Context,
) {
  log(
    `query users ${params.limit} ${params.offset} ${params.queryString} ${
      params.includeGuests ? 'includeGuests' : ''
    }`,
    {
      userId,
    },
  );

  return modules.users.findUsers(params);
}
