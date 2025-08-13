import { buildObfuscatedFieldsFilter } from '@unchainedshop/utils';
import { Context } from '../../../../context.js';
import { Params } from '../schemas.js';

const removeWork = async (context: Context, { workId }: Params<'WORKER_REMOVE'>) => {
  const removePrivateFieldsFromWork = buildObfuscatedFieldsFilter(
    context.options.worker?.blacklistedVariables,
  );
  const { modules } = context;
  await modules.worker.deleteWork(workId);
  const work = await modules.worker.findWork({ workId });
  return {
    work: removePrivateFieldsFromWork(work),
  };
};

export default removeWork;
