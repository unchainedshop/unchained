import { log } from '@unchainedshop/logger';
import { WorkQueueQuery } from '@unchainedshop/types/worker.js';
import { Context } from '../../../types.js';

export default async function workQueueCount(
  root: never,
  params: WorkQueueQuery,
  { modules, userId }: Context,
) {
  log(`query workQueueCount [${params.status?.join(', ')}] ${JSON.stringify(params.created)}`, {
    userId,
  });

  return modules.worker.count(params);
}
