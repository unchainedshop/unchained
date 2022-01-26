import { log } from 'meteor/unchained:logger';
import { Context, Root } from '@unchainedshop/types/api';

export default async function enrollments(
  root: Root,
  { limit, offset }: { limit: number; offset: number },
  { modules, userId }: Context,
) {
  log(`query enrollments: ${limit} ${offset}`, { userId });

  return modules.enrollments.findEnrollments({ limit, offset });
}
