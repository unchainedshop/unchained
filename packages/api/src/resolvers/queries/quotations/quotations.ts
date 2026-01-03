import { log } from '@unchainedshop/logger';
import type { SortOption } from '@unchainedshop/utils';
import type { QuotationQuery } from '@unchainedshop/core-quotations';
import type { Context } from '../../../context.ts';

export default async function quotations(
  root: never,
  params: QuotationQuery & {
    limit?: number;
    offset?: number;
    sort?: SortOption[];
    queryString?: string;
  },
  { services, userId }: Context,
) {
  log(`query quotations: ${params.limit} ${params.offset}`, { userId });

  const { queryString, ...query } = params;

  return services.quotations.searchQuotations(queryString, query);
}
