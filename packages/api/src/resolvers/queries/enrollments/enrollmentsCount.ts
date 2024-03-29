import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api.js';
import { EnrollmentQuery } from '@unchainedshop/types/enrollments.js';

export default async function enrollmentsCount(
  root: Root,
  params: EnrollmentQuery,
  { modules, userId }: Context,
) {
  log(`query enrollmentsCount`, { userId });

  return modules.enrollments.count(params);
}
