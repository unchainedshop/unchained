import { Enrollment, EnrollmentStatus } from '@unchainedshop/core-enrollments';
import { Modules } from '../modules.js';
import { processEnrollmentService } from './processEnrollment.js';

export async function activateEnrollmentService(this: Modules, enrollment: Enrollment) {
  if (enrollment.status === EnrollmentStatus.TERMINATED) return enrollment;

  let updatedEnrollment = await this.enrollments.updateStatus(enrollment._id, {
    status: EnrollmentStatus.ACTIVE,
    info: 'activated manually',
  });

  updatedEnrollment = await processEnrollmentService.bind(this)(updatedEnrollment);

  const user = await this.users.findUserById(enrollment.userId);
  const locale = this.users.userLocale(user);

  await this.worker.addWork({
    type: 'MESSAGE',
    retries: 0,
    input: {
      reason: 'status_change',
      locale,
      template: 'ENROLLMENT_STATUS',
      enrollmentId: updatedEnrollment._id,
    },
  });

  return updatedEnrollment;
}
