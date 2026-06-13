import { type Enrollment, EnrollmentStatus } from '@unchainedshop/core-enrollments';
import { emit } from '@unchainedshop/events';
import type { Modules } from '../modules.ts';
import { processEnrollmentService } from './processEnrollment.ts';
import { addMessageService } from './addMessage.ts';

export async function activateEnrollmentService(this: Modules, enrollment: Enrollment) {
  if (enrollment.status === EnrollmentStatus.TERMINATED || enrollment.status === EnrollmentStatus.ACTIVE)
    return enrollment;

  const isResume = enrollment.status === EnrollmentStatus.SUSPENDED;
  const info = isResume ? 'resumed from suspension' : 'activated manually';

  if (isResume && enrollment.requestedTerminationDate) {
    await this.enrollments.updateRequestedTerminationDate(enrollment._id, null);
  }

  let updatedEnrollment = (await this.enrollments.updateStatus(enrollment._id, {
    status: EnrollmentStatus.ACTIVE,
    info,
  })) as Enrollment;

  if (isResume) {
    await emit('ENROLLMENT_RESUME', { enrollment: updatedEnrollment });
  }

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
