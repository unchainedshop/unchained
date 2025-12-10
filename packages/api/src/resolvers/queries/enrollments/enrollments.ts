import { log } from '@unchainedshop/logger';
import type { SortOption } from '@unchainedshop/utils';
import type { EnrollmentQuery } from '@unchainedshop/core-enrollments';
import type { Context } from '../../../context.ts';

export default async function enrollments(
  root: never,
  params: EnrollmentQuery & {
    limit?: number;
    offset?: number;
    sort?: SortOption[];
  },
  { modules, userId }: Context,
) {
  log(`query enrollments: ${params?.limit} ${params?.offset}`, { userId });
  return modules.enrollments.findEnrollments(params);
}
