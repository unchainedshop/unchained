import { log } from 'meteor/unchained:core-logger';
import { Quotations } from 'meteor/unchained:core-quotations';

export default function quotations(root, { limit, offset }, { userId }) {
  log(`query quotations: ${limit} ${offset}`, { userId });
  return Quotations.findQuotations({ limit, offset }).fetch();
}
