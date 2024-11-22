import { log } from '@unchainedshop/logger';
import { Context } from '../../../context.js';
import { EnrollmentQuery } from '@unchainedshop/core-enrollments';

export default async function enrollmentsCount(
  root: never,
  params: EnrollmentQuery,
  { modules, userId }: Context,
) {
  log(`query enrollmentsCount`, { userId });

  return modules.enrollments.count(params);
}
