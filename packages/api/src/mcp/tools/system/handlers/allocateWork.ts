import { buildObfuscatedFieldsFilter } from '@unchainedshop/utils';
import { Context } from '../../../../context.js';
import { Params } from '../schemas.js';

const allocateWork = async (context: Context, options: Params<'WORKER_ALLOCATE'>) => {
  const { modules } = context;
  const removePrivateFieldsFromWork = buildObfuscatedFieldsFilter(
    context.options.worker?.blacklistedVariables,
  );
  const work = await modules.worker.allocateWork({
    types: options.types || [],
    worker: options.worker || '',
  });
  return {
    work: removePrivateFieldsFromWork(work),
  };
};

export default allocateWork;
