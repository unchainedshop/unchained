import { type Enrollment, EnrollmentStatus } from '@unchainedshop/core-enrollments';
import type { Modules } from '../modules.ts';
import { processEnrollmentService } from './processEnrollment.ts';
import { addMessageService } from './addMessage.ts';

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
