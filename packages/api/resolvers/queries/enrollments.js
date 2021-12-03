import { log } from 'meteor/unchained:logger';
import { Enrollments } from 'meteor/unchained:core-enrollments';

export default function enrollments(root, { limit, offset }, { userId }) {
  log(`query enrollments: ${limit} ${offset}`, { userId });
  return Enrollments.findEnrollments({ limit, offset });
}
