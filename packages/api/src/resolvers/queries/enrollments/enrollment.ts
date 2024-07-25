import { log } from '@unchainedshop/logger';
import { InvalidIdError } from '../../../errors.js';
import { Context } from '../../../types.js';

export default async function enrollment(
  root: never,
  { enrollmentId }: { enrollmentId: string },
  { modules, userId }: Context,
) {
  log(`query enrollment ${enrollmentId}`, { userId, enrollmentId });

  if (!enrollmentId) throw new InvalidIdError({ enrollmentId });

  return modules.enrollments.findEnrollment({ enrollmentId });
}
