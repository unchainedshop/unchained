import { buildObfuscatedFieldsFilter } from '@unchainedshop/utils';
import { Context } from '../../../../context.js';
import { WorkListOptions } from '../types.js';

const listWork = async (context: Context, options?: WorkListOptions) => {
  const { modules } = context;
  const removePrivateFieldsFromWork = buildObfuscatedFieldsFilter(
    context.options.worker?.blacklistedVariables,
  );
  const { limit = 10, offset = 0, queryString, status, sort, types, created } = options || {};

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
