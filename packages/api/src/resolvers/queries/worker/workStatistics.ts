import { log } from '@unchainedshop/logger';
import { Context } from '../../../context.js';
import { DateFilterInput } from '@unchainedshop/utils';

export default async function workStatistics(
  root: never,
  params: { types?: string[]; dateRange?: DateFilterInput },
  { modules, userId }: Context,
) {
  log(`query workStatistics ${(params?.types || []).join(', ')}`, {
    userId,
    ...(params.dateRange || {}),
  });

  return modules.worker.getReport(params);
}
