import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api.js';
import { InvalidIdError } from '../../../errors.js';

export default async function enrollment(
  root: Root,
  { enrollmentId }: { enrollmentId: string },
  { modules, userId }: Context,
) {
  log(`query enrollment ${enrollmentId}`, { userId, enrollmentId });

  if (!enrollmentId) throw new InvalidIdError({ enrollmentId });

  return modules.enrollments.findEnrollment({ enrollmentId });
}
