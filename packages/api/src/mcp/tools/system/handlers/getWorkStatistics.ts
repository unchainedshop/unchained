import { Context } from '../../../../context.js';
import { Params } from '../schemas.js';

const getWorkStatistics = async ({ modules }: Context, options: Params<'WORKER_STATISTICS'>) => {
  const allocationMap = await modules.worker.getReport(options as any);
  return {
    statistics: {
      allocationMap,
      types: options.types || [],
      dateRange: options.dateRange || {},
    },
  };
};

export default getWorkStatistics;
