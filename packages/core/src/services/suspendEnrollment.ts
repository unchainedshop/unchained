import { type Enrollment, EnrollmentStatus } from '@unchainedshop/core-enrollments';
import type { Modules } from '../modules.ts';
import { addMessageService } from './addMessage.ts';

export async function suspendEnrollmentService(this: Modules, enrollment: Enrollment) {
  if (
    enrollment.status === EnrollmentStatus.TERMINATED ||
    enrollment.status === EnrollmentStatus.INITIAL ||
    enrollment.status === EnrollmentStatus.SUSPENDED
  )
    return enrollment;

  const updatedEnrollment = (await this.enrollments.updateStatus(enrollment._id, {
    status: EnrollmentStatus.SUSPENDED,
    info: 'suspended manually',
  })) as Enrollment;

  const user = await this.users.findUserById(enrollment.userId);
  const locale = this.users.userLocale(user);

  await addMessageService.bind(this)('ENROLLMENT_STATUS', {
    reason: 'status_change',
    locale: locale.baseName,
    enrollmentId: updatedEnrollment._id,
  });

  return updatedEnrollment;
}
