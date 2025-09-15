import { Enrollment, EnrollmentStatus } from '@unchainedshop/core-enrollments';
import { processEnrollmentService } from './processEnrollment.js';
import { addMessageService } from './addMessage.js';

export async function terminateEnrollmentService(enrollment: Enrollment) {
  if (enrollment.status === EnrollmentStatus.TERMINATED) return enrollment;

  let updatedEnrollment = await this.enrollments.updateStatus(enrollment._id, {
    status: EnrollmentStatus.TERMINATED,
    info: 'terminated manually',
  });

  updatedEnrollment = await processEnrollmentService.bind(this)(updatedEnrollment);

  const user = await this.users.findUserById(enrollment.userId);
  const locale = this.users.userLocale(user);

  await addMessageService.bind(this)('ENROLLMENT_STATUS', {
    reason: 'status_change',
    locale: locale.baseName,
    enrollmentId: updatedEnrollment._id,
  });

  return updatedEnrollment;
}
