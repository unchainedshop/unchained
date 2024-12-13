import { log } from '@unchainedshop/logger';
import { Context } from '../../../context.js';
import { DateFilterInput } from '@unchainedshop/utils';

export default async function eventStatistics(
  root: never,
  params: { types?: string[]; dateRange?: DateFilterInput },
  { userId, modules }: Context,
) {
  log(`query eventStatistics ${(params?.types || []).join(', ')}`, {
    userId,
    ...(params?.dateRange || {}),
  });

  return modules.events.getReport(params);
}
