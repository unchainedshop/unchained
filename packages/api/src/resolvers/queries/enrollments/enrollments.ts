import { log } from '@unchainedshop/logger';
import { SortOption } from '@unchainedshop/types/api.js';
import { EnrollmentQuery } from '@unchainedshop/types/enrollments.js';
import { Context } from '../../../types.js';

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
