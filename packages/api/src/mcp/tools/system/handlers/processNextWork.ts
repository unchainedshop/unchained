import { WorkerDirector } from '@unchainedshop/core';
import type { Context } from '../../../../context.ts';
import { buildObfuscatedFieldsFilter } from '@unchainedshop/utils';
import type { Params } from '../schemas.ts';

const processNextWork = async (context: Context, options: Params<'WORKER_PROCESS_NEXT'>) => {
  const { worker } = options;
  const removePrivateFieldsFromWork = buildObfuscatedFieldsFilter(
    context.options.worker?.blacklistedVariables,
  );
  const work = WorkerDirector.processNextWork(context, worker);
  return {
    work: removePrivateFieldsFromWork(work),
  };
};

export default processNextWork;
