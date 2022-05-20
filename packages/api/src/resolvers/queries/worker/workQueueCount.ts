import { log } from 'meteor/unchained:logger';
import { Root, Context } from '@unchainedshop/types/api';
import { WorkQueueQuery } from '@unchainedshop/types/worker';

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
