import { Context } from '../../../../context.js';
import { Params } from '../schemas.js';

const getEventsStatistics = async ({ modules }: Context, options: Params<'EVENT_STATISTICS'>) => {
  const statistics = await modules.events.getReport(options as any);
  return { statistics };
};
export default getEventsStatistics;
