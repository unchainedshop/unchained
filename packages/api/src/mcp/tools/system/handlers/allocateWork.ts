import { buildObfuscatedFieldsFilter } from '@unchainedshop/utils';
import { Context } from '../../../../context.js';

const allocateWork = async (context: Context, options: { types?: string[]; worker?: string }) => {
  const { modules } = context;
  const removePrivateFieldsFromWork = buildObfuscatedFieldsFilter(
    context.options.worker?.blacklistedVariables,
  );
  const work = await modules.worker.allocateWork({
    types: options.types || [],
    worker: options.worker || '',
  });
  return {
    work: removePrivateFieldsFromWork(work),
  };
};

export default allocateWork;
