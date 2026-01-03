import { log } from '@unchainedshop/logger';
import type { SortOption, DateFilterInput } from '@unchainedshop/utils';
import type { UserQuery } from '@unchainedshop/core-users';
import type { Context } from '../../../context.ts';

export default async function users(
  root: never,
  params: UserQuery & {
    limit?: number;
    offset?: number;
    sort?: SortOption[];
    includeGuests?: boolean;
    emailVerified?: boolean;
    lastLogin?: DateFilterInput;
    queryString?: string;
  },
  { services, userId }: Context,
) {
  log(`query users ${params.limit} ${params.offset} ${params.includeGuests ? 'includeGuests' : ''}`, {
    userId,
    ...(params || {}),
  });

  const { queryString, ...query } = params;

  return services.users.searchUsers(queryString, query);
}
