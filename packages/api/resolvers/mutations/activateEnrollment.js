import { log } from 'meteor/unchained:core-logger';
import {
  Enrollments,
  EnrollmentStatus,
} from 'meteor/unchained:core-enrollments';
import {
  EnrollmentNotFoundError,
  EnrollmentWrongStatusError,
  InvalidIdError,
} from '../../errors';

export default async function activateEnrollment(
  root,
  { enrollmentId },
  { userId }
) {
  log('mutation activateEnrollment', { userId });
  if (!enrollmentId) throw new InvalidIdError({ enrollmentId });

  const enrollment = Enrollments.findEnrollment({ enrollmentId });
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
  return enrollment.activate();
}
