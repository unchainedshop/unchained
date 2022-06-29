import { log } from '@unchainedshop/logger';
import { Context, Root, SortOption } from '@unchainedshop/types/api';
import { QuotationQuery } from '@unchainedshop/types/quotations';

export default async function quotations(
  root: Root,
  params: QuotationQuery & { limit?: number; offset?: number; sort?: Array<SortOption> },
  { modules, userId }: Context,
) {
  log(`query quotations: ${params.limit} ${params.offset}`, { userId });

  return modules.quotations.findQuotations(params);
}
