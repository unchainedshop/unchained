import { buildObfuscatedFieldsFilter } from '@unchainedshop/utils';
import type { Context } from '../../../../context.ts';
import type { Params } from '../schemas.ts';

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
