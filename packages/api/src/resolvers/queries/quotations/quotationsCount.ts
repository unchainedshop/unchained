import { log } from 'meteor/unchained:logger';
import { Context, Root } from '@unchainedshop/types/api';
import { QuotationQuery } from '@unchainedshop/types/quotations';

export default async function quotationsCount(
  root: Root,
  params: QuotationQuery,
  { modules, userId }: Context,
) {
  log(`query quotationsCount`, { userId });

  return modules.quotations.count(params);
}
