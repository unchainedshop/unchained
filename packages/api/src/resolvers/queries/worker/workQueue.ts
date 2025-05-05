import { log } from '@unchainedshop/logger';
import { SortOption } from '@unchainedshop/utils';
import { WorkStatus } from '@unchainedshop/core-worker';
import { Context } from '../../../context.js';

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
    status?: WorkStatus[];
    types?: string[];
    created?: {
      start: Date;
      end: Date;
    };
    sort?: SortOption[];
  },
  { modules, userId }: Context,
) {
  log(`query workQueue ${limit} ${offset} [${status?.join(', ') || ''}] ${JSON.stringify(created)}`, {
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
