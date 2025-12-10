import { log } from '@unchainedshop/logger';
import type { SortOption } from '@unchainedshop/utils';
import type { QuotationQuery } from '@unchainedshop/core-quotations';
import type { Context } from '../../../context.ts';

export default async function quotations(
  root: never,
  params: QuotationQuery & { limit?: number; offset?: number; sort?: SortOption[] },
  { modules, userId }: Context,
) {
  log(`query quotations: ${params.limit} ${params.offset}`, { userId });

  return modules.quotations.findQuotations(params);
}
