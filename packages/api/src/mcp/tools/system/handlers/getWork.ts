import { buildObfuscatedFieldsFilter } from '@unchainedshop/utils';
import { Context } from '../../../../context.js';
import { Params } from '../schemas.js';

const getWork = async (context: Context, { workId }: Params<'WORKER_GET'>) => {
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
