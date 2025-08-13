import { buildObfuscatedFieldsFilter } from '@unchainedshop/utils';
import { Context } from '../../../../context.js';

const finishWork = async (
  context: Context,
  options: {
    workId: string;
    result?: any;
    error?: any;
    success: boolean;
    worker?: string;
    started?: Date;
    finished?: Date;
  },
) => {
  const removePrivateFieldsFromWork = buildObfuscatedFieldsFilter(
    context.options.worker?.blacklistedVariables,
  );
  const { modules } = context;
  const { workId, ...finishOptions } = options;
  await modules.worker.finishWork(workId, finishOptions);
  const work = await modules.worker.findWork({ workId });
  return {
    work: removePrivateFieldsFromWork(work),
  };
};

export default finishWork;
