import { log } from 'meteor/unchained:logger';
import { Context, Root } from '@unchainedshop/types/api';
import { InvalidIdError } from '../../../errors';

export default async function enrollment(
  root: Root,
  { enrollmentId }: { enrollmentId: string },
  { modules, userId }: Context,
) {
  log(`query enrollment ${enrollmentId}`, { userId, enrollmentId });

  if (!enrollmentId) throw new InvalidIdError({ enrollmentId });

  return modules.enrollments.findEnrollment({ enrollmentId });
}
