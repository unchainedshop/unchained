import { buildObfuscatedFieldsFilter } from '@unchainedshop/utils';
import { WorkerDirector } from '@unchainedshop/core';
import type { Context } from '../../../../context.ts';
import type { Params } from '../schemas.ts';

const allocateWork = async (context: Context, options: Params<'WORKER_ALLOCATE'>) => {
  const removePrivateFieldsFromWork = buildObfuscatedFieldsFilter(
    context.options.worker?.blacklistedVariables,
  );
  const work = await WorkerDirector.allocateWork(context, {
    types: options.types || [],
    worker: options.worker || '',
  });
  return {
    work: removePrivateFieldsFromWork(work),
  };
};

export default allocateWork;
