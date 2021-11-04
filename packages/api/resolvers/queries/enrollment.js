import { log } from 'meteor/unchained:core-logger';
import { Enrollments } from 'meteor/unchained:core-enrollments';
import { InvalidIdError } from '../../errors';

export const mapEnrollment = modules => enrollment => ({
  ...enrollment,
  logs: async ({ limit, offset }) => {
    return await modules.logger.findLogs(
      { 'meta.enrollmentId': enrollment._id },
      {
        skip: offset,
        limit,
        sort: {
          created: -1,
        },
      }
    );
  },
});
export default function enrollment(
  root,
  { enrollmentId },
  { modules, userId }
) {
  log(`query enrollment ${enrollmentId}`, { userId, enrollmentId });

  if (!enrollmentId) throw new InvalidIdError({ enrollmentId });
  const enrollment = Enrollments.findEnrollment({ enrollmentId });
  return mapEnrollment(modules)(enrollment)
}
