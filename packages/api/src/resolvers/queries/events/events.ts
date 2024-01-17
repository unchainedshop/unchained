import { log } from '@unchainedshop/logger';
import { Root, Context } from '@unchainedshop/types/api.js';

type FindEventsParams = Parameters<Context['modules']['events']['findEvents']>['0'];

export default async function events(
  root: Root,
  params: FindEventsParams,
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
