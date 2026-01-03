import { log } from '@unchainedshop/logger';
import type { Context } from '../../../context.ts';
import type { WorkQueueQuery } from '@unchainedshop/core-worker';

export default async function workQueueCount(
  root: never,
  params: WorkQueueQuery & { queryString?: string },
  { services, userId }: Context,
) {
  log(`query workQueueCount [${params.status?.join(', ') || ''}] ${JSON.stringify(params.created)}`, {
    userId,
  });

  const { queryString, ...query } = params;
  return services.worker.searchWorkCount(queryString, query);
}
