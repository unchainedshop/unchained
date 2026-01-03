import { log } from '@unchainedshop/logger';
import type { EventQuery } from '@unchainedshop/core-events';
import type { Context } from '../../../context.ts';

export default async function eventsCount(
  root: never,
  params: EventQuery & { queryString?: string },
  { services, userId }: Context,
) {
  log(`query eventsCount  queryString: ${params.queryString}  types: ${params.types}  ${userId}`, {
    userId,
  });

  const { queryString, ...query } = params;

  return services.events.searchEventsCount(queryString, query);
}
