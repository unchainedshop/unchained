import { log } from '@unchainedshop/logger';
import { Root, Context } from '@unchainedshop/types/api.js';
import { WorkQueueQuery } from '@unchainedshop/types/worker.js';

export default async function workQueueCount(
  root: Root,
  params: WorkQueueQuery,
  { modules, userId }: Context,
) {
  log(`query workQueueCount [${params.status?.join(', ')}] ${JSON.stringify(params.created)}`, {
    userId,
  });

  return modules.worker.count(params);
}
