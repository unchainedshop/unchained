import { log } from '@unchainedshop/logger';
import type { Context } from '../../../context.ts';
import type { EnrollmentQuery } from '@unchainedshop/core-enrollments';

export default async function enrollmentsCount(
  root: never,
  params: EnrollmentQuery,
  { modules, userId }: Context,
) {
  log(`query enrollmentsCount`, { userId });

  return modules.enrollments.count(params);
}
