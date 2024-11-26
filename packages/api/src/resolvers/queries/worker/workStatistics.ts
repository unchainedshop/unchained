import { log } from '@unchainedshop/logger';
import { Root, Context } from '@unchainedshop/types/api.js';
import { DateFilterInput } from '@unchainedshop/types/common.js';

export default async function workStatistics(
  root: Root,
  params: { types?: string[]; dateRange?: DateFilterInput },
  { modules, userId }: Context,
) {
  log(`query workStatistics ${(params?.types || []).join(', ')}`, {
    userId,
    ...(params.dateRange || {}),
  });

  return modules.worker.getReport(params);
}
