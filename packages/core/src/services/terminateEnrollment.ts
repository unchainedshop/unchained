import { type Enrollment, EnrollmentStatus } from '@unchainedshop/core-enrollments';
import { processEnrollmentService } from './processEnrollment.ts';
import { addMessageService } from './addMessage.ts';

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
