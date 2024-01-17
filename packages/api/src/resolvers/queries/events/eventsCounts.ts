import { log } from '@unchainedshop/logger';
import { Root, Context } from '@unchainedshop/types/api.js';

type CountEventsParams = Parameters<Context['modules']['events']['count']>['0'];

export default async function eventsCount(
  root: Root,
  params: CountEventsParams,
  { modules, userId }: Context,
) {
  log(`query eventsCount  queryString: ${params.queryString}  types: ${params.types}  ${userId}`, {
    userId,
  });

  return modules.events.count(params);
}
