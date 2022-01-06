import { log } from 'meteor/unchained:logger';
import { Quotations } from 'meteor/unchained:core-quotations';

export default async function quotations(root: Root, { limit, offset }, { modules, userId }: Context) {
  log(`query quotations: ${limit} ${offset}`, { userId });

  return Quotations.findQuotations({ limit, offset });
}
