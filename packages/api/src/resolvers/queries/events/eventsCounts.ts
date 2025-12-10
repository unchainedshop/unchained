import { log } from '@unchainedshop/logger';
import type { Context } from '../../../context.ts';

type CountEventsParams = Parameters<Context['modules']['events']['count']>['0'];

export default async function eventsCount(
  root: never,
  params: CountEventsParams,
  { modules, userId }: Context,
) {
  log(`query eventsCount  queryString: ${params.queryString}  types: ${params.types}  ${userId}`, {
    userId,
  });

  return modules.events.count(params);
}
