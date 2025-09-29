import { buildObfuscatedFieldsFilter } from '@unchainedshop/utils';
import { WorkListOptions } from '../types.js';
import { UnchainedCore } from '@unchainedshop/core';

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
