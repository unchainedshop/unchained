import { log } from 'meteor/unchained:core-logger';
import { Enrollments } from 'meteor/unchained:core-enrollments';
import { InvalidIdError } from '../../errors';

export default function enrollment(root, { enrollmentId }, { userId }) {
  log(`query enrollment ${enrollmentId}`, { userId, enrollmentId });

  if (!enrollmentId) throw new InvalidIdError({ enrollmentId });
  return Enrollments.findEnrollment({ enrollmentId });
}
