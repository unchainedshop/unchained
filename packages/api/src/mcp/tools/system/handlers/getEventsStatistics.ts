import { DateFilterInput } from '@unchainedshop/utils';
import { Context } from '../../../../context.js';

const getEventsStatistics = async (
  { modules }: Context,
  options: { types?: string[]; dateRange?: DateFilterInput },
) => {
  const statistics = await modules.events.getReport(options);
  return { statistics };
};
export default getEventsStatistics;
