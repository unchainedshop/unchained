import {
  Enrollments,
  EnrollmentStatus,
} from 'meteor/unchained:core-enrollments';
import { log } from 'meteor/unchained:core-logger';
import {
  EnrollmentNotFoundError,
  EnrollmentWrongStatusError,
  InvalidIdError,
} from '../../errors';
import { transformEnrollment } from '../transformations/transformEnrollment';

export default async function activateEnrollment(
  root,
  { enrollmentId },
  { modules, userId }
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
  const activeEnrollment = await enrollment.activate();
  return transformEnrollment(modules)(activeEnrollment);
}
