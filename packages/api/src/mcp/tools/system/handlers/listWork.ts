import { buildObfuscatedFieldsFilter } from '@unchainedshop/utils';
import type { WorkListOptions } from '../types.ts';
import type { UnchainedCore } from '@unchainedshop/core';

const listWork = async (context: UnchainedCore, options?: WorkListOptions) => {
  const { services } = context;
  const removePrivateFieldsFromWork = buildObfuscatedFieldsFilter(
    context.options.worker?.blacklistedVariables,
  );
  const { limit = 10, offset = 0, queryString, status, types, created } = options || ({} as any);

  const workQueue = await services.worker.searchWork(
    queryString,
    { status, types, created },
    { limit, offset },
  );
  return { works: workQueue.map(removePrivateFieldsFromWork) };
};

export default listWork;
