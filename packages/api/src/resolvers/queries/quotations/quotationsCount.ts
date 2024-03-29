import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api.js';
import { QuotationQuery } from '@unchainedshop/types/quotations.js';

export default async function quotationsCount(
  root: Root,
  params: QuotationQuery,
  { modules, userId }: Context,
) {
  log(`query quotationsCount`, { userId });

  return modules.quotations.count(params);
}
