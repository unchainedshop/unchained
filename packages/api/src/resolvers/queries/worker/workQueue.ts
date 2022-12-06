import { log } from '@unchainedshop/logger';
import { Root, Context, SortOption } from '@unchainedshop/types/api';
import { WorkStatus } from '@unchainedshop/types/worker';

export default async function workQueue(
  root: Root,
  {
    limit,
    offset,
    status,
    types,
    created,
    queryString,
    sort,
  }: {
    limit?: number;
    offset?: number;
    queryString?: string;
    status?: Array<WorkStatus>;
    types?: Array<string>;
    created?: {
      start: Date;
      end: Date;
    };
    sort?: Array<SortOption>;
  },
  { modules, userId }: Context,
) {
  log(`query workQueue ${limit} ${offset} [${status?.join(', ')}] ${JSON.stringify(created)}`, {
    userId,
  });
  return modules.worker.findWorkQueue({
    status,
    types,
    created,
    skip: offset,
    limit,
    queryString,
    sort,
  });
}
