import { log } from 'meteor/unchained:logger';
import { Context, Root } from '@unchainedshop/types/api';
import { QuotationQuery } from '@unchainedshop/types/quotations';

export default async function quotations(
  root: Root,
  { limit, offset, queryString }: QuotationQuery & { limit?: number; offset?: number },
  { modules, userId }: Context,
) {
  log(`query quotations: ${limit} ${offset}`, { userId });

  return modules.quotations.findQuotations({ limit, offset, queryString });
}
