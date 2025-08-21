import { buildObfuscatedFieldsFilter } from '@unchainedshop/utils';
import { Context } from '../../../../context.js';
import { Params } from '../schemas.js';
import { WorkData } from '@unchainedshop/core-worker';

const addWork = async (context: Context, options: Params<'WORKER_ADD'>) => {
  const { modules } = context;
  const removePrivateFieldsFromWork = buildObfuscatedFieldsFilter(
    context.options.worker?.blacklistedVariables,
  );
  const work = await modules.worker.addWork(options as unknown as WorkData);
  return {
    work: removePrivateFieldsFromWork(work),
  };
};

export default addWork;
