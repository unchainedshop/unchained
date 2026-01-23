import { type WorkStatus } from '@unchainedshop/core-worker';
import type { Context } from '../../../../context.ts';

export interface WorkCountOptions {
  queryString?: string;
  status?: WorkStatus[];
  created?: {
    start?: Date;
    end?: Date;
  };
  types?: string[];
}

const countWork = async ({ modules }: Context, options?: WorkCountOptions) => {
  const countOptions = options || {};
  const count = await modules.worker.count({
    ...countOptions,
    status: countOptions?.status || [],
  });
  return { count };
};

export default countWork;
