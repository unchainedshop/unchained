import { log } from 'meteor/unchained:logger';
import { Context, Root } from '@unchainedshop/types/api';
import { UserQuery } from '@unchainedshop/types/user';

export default async function users(
  root: Root,
  params: UserQuery & {
    limit?: number;
    offset?: number;
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
