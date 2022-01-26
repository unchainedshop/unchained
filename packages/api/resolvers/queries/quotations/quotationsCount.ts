import { log } from 'meteor/unchained:logger';
import { Context, Root } from '@unchainedshop/types/api';

export default async function quotationsCount(
  root: Root,
  _: never,
  { modules, userId }: Context
) {
  log(`query quotationsCount`, { userId });

  return modules.quotations.count();
}
