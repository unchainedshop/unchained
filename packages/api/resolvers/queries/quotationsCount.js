import { log } from 'meteor/unchained:logger';
import { Quotations } from 'meteor/unchained:core-quotations';

export default async function quotationsCount(root: Root, _, { modules, userId }: Context) {
  log(`query quotationsCount`, { userId });
  return Quotations.count();
}
