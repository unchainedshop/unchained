import { log } from '@unchainedshop/logger';
import type { Context } from '../../../context.ts';
import type { DateFilterInput } from '@unchainedshop/utils';

export default async function orderStatistics(
  root: never,
  params: { dateRange?: DateFilterInput },
  { userId }: Context,
) {
  const { dateRange } = params || {};
  log(`query orderStatistics `, {
    userId,
    ...(params?.dateRange || {}),
  });
  return { dateRange };
}
