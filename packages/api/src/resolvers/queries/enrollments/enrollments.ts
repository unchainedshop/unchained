import { log } from 'meteor/unchained:logger';
import { Context, Root } from '@unchainedshop/types/api';
import { EnrollmentQuery } from '@unchainedshop/types/enrollments';

export default async function enrollments(
  root: Root,
  params: EnrollmentQuery & {
    limit: number;
    offset: number;
  },
  { modules, userId }: Context,
) {
  log(`query enrollments: ${params?.limit} ${params?.offset}`, { userId });
  return modules.enrollments.findEnrollments(params);
}
