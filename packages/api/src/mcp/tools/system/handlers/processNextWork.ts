import { WorkerDirector } from '@unchainedshop/core';
import { Context } from '../../../../context.js';
import { buildObfuscatedFieldsFilter } from '@unchainedshop/utils';

const processNextWork = async (context: Context, options: { worker?: string }) => {
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
