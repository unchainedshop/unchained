import { log } from '@unchainedshop/logger';
import { Root, Context } from '@unchainedshop/types/api.js';
import { DateFilterInput } from '@unchainedshop/types/common.js';

export default async function orderStatistics(
  root: Root,
  params: { dateRange: DateFilterInput },
  { modules, userId }: Context,
) {
  log(`query orderStatistics `, {
    userId,
    ...(params?.dateRange || {}),
  });

  return modules.orders.getReport(params);
}
