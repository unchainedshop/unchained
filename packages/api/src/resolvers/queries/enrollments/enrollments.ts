import { log } from '@unchainedshop/logger';
import { SortOption } from '@unchainedshop/utils';
import { EnrollmentQuery } from '@unchainedshop/core-enrollments';
import { Context } from '../../../context.js';

export default async function enrollments(
  root: never,
  params: EnrollmentQuery & {
    limit?: number;
    offset?: number;
    sort?: Array<SortOption>;
  },
  { modules, userId }: Context,
) {
  log(`query enrollments: ${params?.limit} ${params?.offset}`, { userId });
  return modules.enrollments.findEnrollments(params);
}
