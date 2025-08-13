import { buildObfuscatedFieldsFilter } from '@unchainedshop/utils';
import { Context } from '../../../../context.js';

const getWork = async (context: Context, { workId }: { workId: string }) => {
  const removePrivateFieldsFromWork = buildObfuscatedFieldsFilter(
    context.options.worker?.blacklistedVariables,
  );
  const { modules } = context;
  const work = await modules.worker.findWork({ workId });

  return {
    work: removePrivateFieldsFromWork(work),
  };
};

export default getWork;
