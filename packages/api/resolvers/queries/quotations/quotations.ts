import { log } from 'meteor/unchained:logger';
import { Context, Root } from '@unchainedshop/types/api';

export default async function quotations(
  root: Root,
  { limit, offset }: { limit: number; offset: number },
  { modules, userId }: Context
) {
  log(`query quotations: ${limit} ${offset}`, { userId });

  return modules.quotations.findQuotations({ limit, offset });
}
