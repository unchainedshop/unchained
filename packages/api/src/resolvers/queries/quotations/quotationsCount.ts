import { log } from '@unchainedshop/logger';
import type { Context } from '../../../context.ts';
import type { QuotationQuery } from '@unchainedshop/core-quotations';

export default async function quotationsCount(
  root: never,
  params: QuotationQuery,
  { modules, userId }: Context,
) {
  log(`query quotationsCount`, { userId });

  return modules.quotations.count(params);
}
