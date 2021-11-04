import { log } from 'meteor/unchained:core-logger';
import { Enrollments } from 'meteor/unchained:core-enrollments';
import { InvalidIdError } from '../../errors';
import { transformEnrollment } from '../transformations/transformEnrollment';

export default function enrollment(
  root,
  { enrollmentId },
  { modules, userId }
) {
  log(`query enrollment ${enrollmentId}`, { userId, enrollmentId });

  if (!enrollmentId) throw new InvalidIdError({ enrollmentId });
  const enrollment = Enrollments.findEnrollment({ enrollmentId });
  return transformEnrollment(modules)(enrollment);
}
