import { log } from 'meteor/unchained:logger';
import { Root, Context } from '@unchainedshop/types/api';
import { WorkStatus } from '@unchainedshop/types/worker';

export default async function workers(
  root: Root,
  {
    limit,
    offset,
    status,
    selectTypes,
    created,
  }: {
    limit?: number;
    offset?: number;
    status?: Array<WorkStatus>;
    selectTypes?: Array<string>;
    created?: {
      start: Date;
      end: Date;
    };
  },
  { modules, userId }: Context,
) {
  log(`query workQueue ${limit} ${offset} [${status?.join(', ')}] ${JSON.stringify(created)}`, {
    userId,
  });

  return modules.worker.findWorkQueue({
    status,
    selectTypes,
    created,
    skip: offset,
    limit,
  });
}
