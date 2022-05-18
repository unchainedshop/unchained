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
    queryString,
    types,
    sort,
  }: {
    limit?: number;
    offset?: number;
    queryString?: string;
    status?: Array<WorkStatus>;
    selectTypes?: Array<string>;
    types?: Array<string>;
    created?: {
      start: Date;
      end: Date;
    };
    sort?: Array<{ key: string; value: 'DESC' | 'ASC' }>;
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
    queryString,
    sort,
    types,
  });
}
