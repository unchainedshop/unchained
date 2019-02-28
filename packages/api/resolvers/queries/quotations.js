import { log } from 'meteor/unchained:core-logger';
import { Quotations } from 'meteor/unchained:core-quotations';

export default function (root, { limit = 10, offset = 0 }, { userId }) {
  log(`query quotations: ${limit} ${offset}`, { userId });
  const selector = { };
  const quotations = Quotations.find(selector, { skip: offset, limit }).fetch();
  return quotations;
}
