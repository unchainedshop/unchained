import { log } from 'meteor/unchained:logger';
import { Enrollments } from 'meteor/unchained:core-enrollments';

export default function enrollmentsCount(root, _, { userId }) {
  log(`query enrollmentsCount`, { userId });
  return Enrollments.count();
}
