import type { Context } from '../../../context.ts';
import { EnrollmentStatus } from '@unchainedshop/core-enrollments';
import { log } from '@unchainedshop/logger';
import { EnrollmentNotFoundError, EnrollmentWrongStatusError, InvalidIdError } from '../../../errors.ts';

export default async function activateEnrollment(
  root: never,
  { enrollmentId }: { enrollmentId: string },
  context: Context,
) {
  const { modules, services, userId } = context;

  log('mutation activateEnrollment', { userId });

  if (!enrollmentId) throw new InvalidIdError({ enrollmentId });

  const enrollment = await modules.enrollments.findEnrollment({ enrollmentId });
  if (!enrollment) {
    throw new EnrollmentNotFoundError({
      enrollmentId,
    });
  }

  if (
    enrollment.status === EnrollmentStatus.ACTIVE ||
    enrollment.status === EnrollmentStatus.TERMINATED
  ) {
    throw new EnrollmentWrongStatusError({ status: enrollment.status });
  }

  return services.enrollments.activateEnrollment(enrollment);
}
