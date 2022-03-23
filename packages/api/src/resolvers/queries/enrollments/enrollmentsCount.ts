import { log } from 'meteor/unchained:logger';
import { Context, Root } from '@unchainedshop/types/api';

export default async function enrollmentsCount(root: Root, _: never, { modules, userId }: Context) {
  log(`query enrollmentsCount`, { userId });

  return modules.enrollments.count();
}
