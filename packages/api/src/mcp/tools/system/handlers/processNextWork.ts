import { WorkerDirector } from '@unchainedshop/core';
import { Context } from '../../../../context.js';
import { buildObfuscatedFieldsFilter } from '@unchainedshop/utils';
import { Params } from '../schemas.js';

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
