import { log } from 'meteor/unchained:logger';
import { Root, Context } from '@unchainedshop/types/api';
import { WorkStatus } from '@unchainedshop/types/worker';

export default async function workQueueCount(
  root: Root,
  {
    status,
    created,
    queryString,
    types,
  }: {
    queryString?: string;
    status?: Array<WorkStatus>;
    types?: Array<string>;
    created?: {
      start: Date;
      end: Date;
    };
  },
  { modules, userId }: Context,
) {
  log(`query workQueueCount [${status?.join(', ')}] ${JSON.stringify(created)}`, {
    userId,
  });

  return modules.worker.count({
    status,
    created,
    queryString,
    types,
  });
}
