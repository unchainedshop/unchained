import { log } from 'meteor/unchained:core-logger';
import { Quotations } from 'meteor/unchained:core-quotations';

export default function quotationsCount(root, _, { userId }) {
  log(`query quotationsCount`, { userId });
  return Quotations.count();
}
