import { log } from 'meteor/unchained:core-logger';
import { Quotations } from 'meteor/unchained:core-quotations';
import { transformQuotation } from '../transformations/transformQuotation';

export default function quotations(
  root,
  { limit, offset },
  { modules, userId }
) {
  log(`query quotations: ${limit} ${offset}`, { userId });

  const quotations = Quotations.findQuotations({ limit, offset });
  return quotations.map(transformQuotation(modules));
}
