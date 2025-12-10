import type { Context } from '../../../../context.ts';
import type { WorkCountOptions } from '../types.ts';

const countWork = async ({ modules }: Context, options?: WorkCountOptions) => {
  const countOptions = options || {};
  const count = await modules.worker.count({
    ...countOptions,
    status: countOptions?.status || [],
  });
  return { count };
};

export default countWork;
