import { log } from 'unchained-logger';
import { Enrollments } from 'meteor/unchained:core-enrollments';

export default function enrollment(root, { limit, offset }, { userId }) {
  log(`query enrollments: ${limit} ${offset}`, { userId });
  return Enrollments.findEnrollments({ limit, offset });
}
