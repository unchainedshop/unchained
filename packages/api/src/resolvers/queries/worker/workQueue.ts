import { log } from '@unchainedshop/logger';
import { SortOption } from '@unchainedshop/types/api.js';
import { WorkStatus } from '@unchainedshop/types/worker.js';
import { Context } from '../../../types.js';

export default async function workQueue(
  root: never,
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
