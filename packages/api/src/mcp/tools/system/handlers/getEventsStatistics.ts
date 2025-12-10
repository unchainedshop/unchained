import type { Context } from '../../../../context.ts';
import type { Params } from '../schemas.ts';

const getEventsStatistics = async ({ modules }: Context, options: Params<'EVENT_STATISTICS'>) => {
  const statistics = await modules.events.getReport(options as any);
  return { statistics };
};
export default getEventsStatistics;
