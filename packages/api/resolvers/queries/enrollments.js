import { log } from 'meteor/unchained:core-logger';
import { Enrollments } from 'meteor/unchained:core-enrollments';
import { transformEnrollment } from '../transformations/transformEnrollment';

export default function enrollment(root, { limit, offset }, { modules, userId }) {
  log(`query enrollments: ${limit} ${offset}`, { userId });
  const enrollments = Enrollments.findEnrollments({ limit, offset })
  return enrollments.map(transformEnrollment(modules));
}
