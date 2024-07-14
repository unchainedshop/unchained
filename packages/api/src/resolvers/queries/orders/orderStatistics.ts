import { log } from '@unchainedshop/logger';
import { Root, Context } from '@unchainedshop/types/api.js';

export default async function orderStatistics(
  root: Root,
  params: { from?: Date; to?: Date },
  { modules, userId }: Context,
) {
  log(`query orderStatistics ${params.from || ''} ${params.to || ''}`, {
    userId,
  });

  return modules.orders.getReport(params);
}
