import { log } from '@unchainedshop/logger';
import { SortOption, DateFilterInput } from '@unchainedshop/utils';
import { UserQuery } from '@unchainedshop/core-users';
import { Context } from '../../../context.js';

export default async function users(
  root: never,
  params: UserQuery & {
    limit?: number;
    offset?: number;
    sort?: SortOption[];
    includeGuests?: boolean;
    emailVerified?: boolean;
    lastLogin?: DateFilterInput;
  },
  { modules, userId }: Context,
) {
  log(
    `query users ${params.limit} ${params.offset} ${params.queryString} ${
      params.includeGuests ? 'includeGuests' : ''
    }`,
    {
      userId,
      ...(params || {}),
    },
  );

  return modules.users.findUsers(params);
}
