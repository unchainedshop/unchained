import { buildObfuscatedFieldsFilter, type SortOption } from '@unchainedshop/utils';
import { type WorkStatus } from '@unchainedshop/core-worker';
import type { UnchainedCore } from '@unchainedshop/core';

export interface WorkListOptions {
  limit?: number;
  offset?: number;
  queryString?: string;
  status: WorkStatus[];
  types?: string[];
  sort?: SortOption[];
  created?: {
    start?: Date;
    end?: Date;
  };
}

const listWork = async (context: UnchainedCore, options?: WorkListOptions) => {
  const { modules } = context;
  const removePrivateFieldsFromWork = buildObfuscatedFieldsFilter(
    context.options.worker?.blacklistedVariables,
  );
  const { limit = 10, offset = 0, queryString, status, sort, types, created } = options || ({} as any);

  const workQueue = await modules.worker.findWorkQueue({
    status,
    types,
    created,
    queryString,
    skip: offset,
    limit,
    sort,
  });
  return { works: workQueue.map(removePrivateFieldsFromWork) };
};

export default listWork;
