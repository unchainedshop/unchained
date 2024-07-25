import { log } from '@unchainedshop/logger';
import { Context } from '../../../types.js';

type FindEventsParams = Parameters<Context['modules']['events']['findEvents']>['0'];

export default async function events(
  root: never,
  params: FindEventsParams,
  { modules, userId }: Context,
) {
  log(
    `query events ${params.types?.join(',') || '*'} limit: ${params.limit} offset: ${params.offset} queryString: ${params.queryString}`,
    {
      userId,
    },
  );

  return modules.events.findEvents(params);
}
