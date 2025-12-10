import { buildObfuscatedFieldsFilter } from '@unchainedshop/utils';
import type { Context } from '../../../../context.ts';
import type { Params } from '../schemas.ts';
import type { WorkData } from '@unchainedshop/core-worker';

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
