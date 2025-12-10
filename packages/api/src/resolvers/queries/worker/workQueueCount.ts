import { log } from '@unchainedshop/logger';
import type { Context } from '../../../context.ts';
import type { WorkQueueQuery } from '@unchainedshop/core-worker';

export default async function workQueueCount(
  root: never,
  params: WorkQueueQuery,
  { modules, userId }: Context,
) {
  log(`query workQueueCount [${params.status?.join(', ') || ''}] ${JSON.stringify(params.created)}`, {
    userId,
  });

  return modules.worker.count(params);
}
