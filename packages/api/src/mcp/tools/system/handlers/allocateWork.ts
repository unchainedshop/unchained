import { buildObfuscatedFieldsFilter } from '@unchainedshop/utils';
import type { Context } from '../../../../context.ts';
import type { Params } from '../schemas.ts';

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
