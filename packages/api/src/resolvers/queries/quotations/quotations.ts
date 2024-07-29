import { log } from '@unchainedshop/logger';
import { SortOption } from '@unchainedshop/utils';
import { QuotationQuery } from '@unchainedshop/core-quotations';
import { Context } from '../../../types.js';

export default async function quotations(
  root: never,
  params: QuotationQuery & { limit?: number; offset?: number; sort?: Array<SortOption> },
  { modules, userId }: Context,
) {
  log(`query quotations: ${params.limit} ${params.offset}`, { userId });

  return modules.quotations.findQuotations(params);
}
