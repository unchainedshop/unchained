import { log } from '@unchainedshop/logger';
import { Context } from '../../../context.js';

export default async function orderStatistics(
  root: never,
  params: { from?: Date; to?: Date },
  { modules, userId }: Context,
) {
  log(`query orderStatistics ${params.from || ''} ${params.to || ''}`, {
    userId,
  });

  return modules.orders.getReport(params);
}
