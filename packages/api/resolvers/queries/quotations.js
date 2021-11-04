import { log } from 'meteor/unchained:core-logger';
import { Quotations } from 'meteor/unchained:core-quotations';
import { mapQuotation } from './quotation';

export default function quotations(root, { limit, offset }, { modules, userId }) {
  log(`query quotations: ${limit} ${offset}`, { userId });
  return Quotations.findQuotations({ limit, offset }).map(mapQuotation(modules));
}
