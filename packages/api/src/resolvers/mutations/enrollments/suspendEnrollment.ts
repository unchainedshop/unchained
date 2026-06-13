import { log } from '@unchainedshop/logger';
import { EnrollmentStatus } from '@unchainedshop/core-enrollments';
import { EnrollmentNotFoundError, EnrollmentWrongStatusError, InvalidIdError } from '../../../errors.ts';
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

  if (
    enrollment.status === EnrollmentStatus.TERMINATED ||
    enrollment.status === EnrollmentStatus.INITIAL ||
    enrollment.status === EnrollmentStatus.SUSPENDED
  ) {
    throw new EnrollmentWrongStatusError({ status: enrollment.status });
  }

  return services.enrollments.suspendEnrollment(enrollment);
}
