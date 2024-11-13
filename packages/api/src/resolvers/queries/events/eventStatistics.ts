import { log } from '@unchainedshop/logger';
import { Root, Context } from '@unchainedshop/types/api.js';
import { DateFilterInput } from '@unchainedshop/types/common.js';

export default async function eventStatistics(
  root: Root,
  params: { types?: string[]; dateRange?: DateFilterInput },
  { userId, modules }: Context,
) {
  log(`query eventStatistics ${(params?.types || []).join(', ')}`, {
    userId,
    ...(params?.dateRange || {}),
  });

  return modules.events.getReport(params);
}
