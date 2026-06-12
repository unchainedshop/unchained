import { log } from '@unchainedshop/logger';
import { EnrollmentNotFoundError, InvalidIdError } from '../../../errors.ts';
import type { Context } from '../../../context.ts';

export default async function suspendEnrollment(
  root: never,
  { enrollmentId }: { enrollmentId: string },
  { modules, services, userId }: Context,
) {
  log('mutation suspendEnrollment', { userId });

  if (!enrollmentId) throw new InvalidIdError({ enrollmentId });

  const enrollment = await modules.enrollments.findEnrollment({
    enrollmentId,
  });
  if (!enrollment) throw new EnrollmentNotFoundError({ enrollmentId });

  return services.enrollments.suspendEnrollment(enrollment);
}
