import { log } from '@unchainedshop/logger';
import type { SortOption } from '@unchainedshop/utils';
import { WorkStatus } from '@unchainedshop/core-worker';
import type { Context } from '../../../context.ts';

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
  { services, userId }: Context,
) {
  log(`query workQueue ${limit} ${offset} [${status?.join(', ') || ''}] ${JSON.stringify(created)}`, {
    userId,
  });
  return services.worker.searchWork(queryString, { status, types, created }, { limit, offset, sort });
}
