import { log } from 'meteor/unchained:core-logger';
import { Enrollments } from 'meteor/unchained:core-enrollments';
import { mapEnrollment } from './enrollment';

export default function enrollment(root, { limit, offset }, { modules, userId }) {
  log(`query enrollments: ${limit} ${offset}`, { userId });
  return Enrollments.findEnrollments({ limit, offset }).map(mapEnrollment(modules));
}
