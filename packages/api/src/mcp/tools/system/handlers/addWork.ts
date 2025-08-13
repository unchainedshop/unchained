import { buildObfuscatedFieldsFilter } from '@unchainedshop/utils';
import { Context } from '../../../../context.js';

const addWork = async (
  context: Context,
  options: {
    type: string;
    priority?: number;
    input?: any;
    originalWorkId?: string;
    scheduled?: Date;
    retries?: number;
    worker?: string;
  },
) => {
  const { modules } = context;
  const removePrivateFieldsFromWork = buildObfuscatedFieldsFilter(
    context.options.worker?.blacklistedVariables,
  );
  const work = await modules.worker.addWork(options);
  return {
    work: removePrivateFieldsFromWork(work),
  };
};

export default addWork;
