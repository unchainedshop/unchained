import { DateFilterInput } from '@unchainedshop/utils';
import { Context } from '../../../../context.js';

const getWorkStatistics = async (
  { modules }: Context,
  options: { types?: string[]; dateRange?: DateFilterInput },
) => {
  const allocationMap = await modules.worker.getReport(options);
  return {
    statistics: {
      allocationMap,
      types: options.types || [],
      dateRange: options.dateRange || {},
    },
  };
};

export default getWorkStatistics;
