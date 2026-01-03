import { log } from '@unchainedshop/logger';
import type { SortOption } from '@unchainedshop/utils';
import type { EventQuery } from '@unchainedshop/core-events';
import type { Context } from '../../../context.ts';

export default async function events(
  root: never,
  params: EventQuery & { queryString?: string; limit?: number; offset?: number; sort?: SortOption[] },
  { services, userId }: Context,
) {
  const { queryString, ...query } = params;
  log(
    `query events ${params.types?.join(',') || '*'} limit: ${params.limit} offset: ${params.offset} queryString: ${queryString}`,
    {
      userId,
    },
  );

  return services.events.searchEvents(queryString, query);
}
