import { Enrollment, EnrollmentStatus } from '@unchainedshop/core-enrollments';
import { Modules } from '../modules.js';
import { processEnrollmentService } from './processEnrollment.js';
import { addMessageService } from './addMessage.js';

export async function activateEnrollmentService(this: Modules, enrollment: Enrollment) {
  if (enrollment.status === EnrollmentStatus.TERMINATED) return enrollment;

  let updatedEnrollment = (await this.enrollments.updateStatus(enrollment._id, {
    status: EnrollmentStatus.ACTIVE,
    info: 'activated manually',
  })) as Enrollment;

  updatedEnrollment = (await processEnrollmentService.bind(this)(updatedEnrollment)) as Enrollment;

  const user = await this.users.findUserById(enrollment.userId);
  const locale = this.users.userLocale(user);

  await addMessageService.bind(this)('ENROLLMENT_STATUS', {
    reason: 'status_change',
    locale: locale.baseName,
    enrollmentId: updatedEnrollment!._id,
  });

  return updatedEnrollment!;
}
