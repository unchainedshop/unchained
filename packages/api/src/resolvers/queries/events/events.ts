import { log } from '@unchainedshop/logger';
import { Root, Context, SortOption } from '@unchainedshop/types/api';
import { EventQuery } from '@unchainedshop/types/events';

export default async function events(
  root: Root,
  params: EventQuery & {
    limit?: number;
    offset?: number;
    sort: Array<SortOption>;
  },
  { modules, userId }: Context,
) {
  log(
    `query events ${params.types}  limit: ${params.limit} offset: ${params.offset} queryString: ${params.queryString}`,
    {
      userId,
    },
  );

  return modules.events.findEvents(params);
}
