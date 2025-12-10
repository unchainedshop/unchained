import { buildObfuscatedFieldsFilter } from '@unchainedshop/utils';
import type { Context } from '../../../../context.ts';
import type { Params } from '../schemas.ts';

const finishWork = async (context: Context, options: Params<'WORKER_FINISH_WORK'>) => {
  const removePrivateFieldsFromWork = buildObfuscatedFieldsFilter(
    context.options.worker?.blacklistedVariables,
  );
  const { modules } = context;
  const { workId, ...finishOptions } = options;
  await modules.worker.finishWork(workId, finishOptions as any);
  const work = await modules.worker.findWork({ workId });
  return {
    work: removePrivateFieldsFromWork(work),
  };
};

export default finishWork;
