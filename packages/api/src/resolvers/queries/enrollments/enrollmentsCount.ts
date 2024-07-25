import { log } from '@unchainedshop/logger';
import { Context } from '../../../types.js';
import { EnrollmentQuery } from '@unchainedshop/types/enrollments.js';

export default async function enrollmentsCount(
  root: never,
  params: EnrollmentQuery,
  { modules, userId }: Context,
) {
  log(`query enrollmentsCount`, { userId });

  return modules.enrollments.count(params);
}
