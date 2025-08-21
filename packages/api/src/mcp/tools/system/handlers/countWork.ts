import { Context } from '../../../../context.js';
import { WorkCountOptions } from '../types.js';

const countWork = async ({ modules }: Context, options?: WorkCountOptions) => {
  const countOptions = options || {};
  const count = await modules.worker.count({
    ...countOptions,
    status: countOptions?.status || [],
  });
  return { count };
};

export default countWork;
