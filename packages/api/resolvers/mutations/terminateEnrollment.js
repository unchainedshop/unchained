import { log } from 'meteor/unchained:logger';
import {
  Enrollments,
  EnrollmentStatus,
} from 'meteor/unchained:core-enrollments';
import {
  EnrollmentNotFoundError,
  EnrollmentWrongStatusError,
  InvalidIdError,
} from '../../errors';

export default async function terminateEnrollment(
  root,
  { enrollmentId },
  { userId }
) {
  log('mutation terminateEnrollment', { userId });
  if (!enrollmentId) throw new InvalidIdError({ enrollmentId });
  const enrollment = Enrollments.findEnrollment({ enrollmentId });
  if (!enrollment) {
    throw new EnrollmentNotFoundError({
      enrollmentId,
    });
  }
  if (enrollment.status === EnrollmentStatus.TERMINATED) {
    throw new EnrollmentWrongStatusError({ status: enrollment.status });
  }
  return enrollment.terminate();
}
