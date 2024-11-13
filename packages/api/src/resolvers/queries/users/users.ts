import { log } from '@unchainedshop/logger';
import { Context, Root, SortOption } from '@unchainedshop/types/api.js';
import { UserQuery } from '@unchainedshop/types/user.js';

export default async function users(
  root: Root,
  params: UserQuery & {
    limit?: number;
    offset?: number;
    sort?: Array<SortOption>;
    includeGuests?: boolean;
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
