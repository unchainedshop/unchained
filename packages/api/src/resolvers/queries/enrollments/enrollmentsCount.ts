import { log } from 'meteor/unchained:logger';
import { Context, Root } from '@unchainedshop/types/api';
import { EnrollmentQuery } from '@unchainedshop/types/enrollments';

export default async function enrollmentsCount(
  root: Root,
  params: EnrollmentQuery,
  { modules, userId }: Context,
) {
  log(`query enrollmentsCount`, { userId });

  return modules.enrollments.count(params);
}
