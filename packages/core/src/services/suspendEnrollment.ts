import { type Enrollment, EnrollmentStatus } from '@unchainedshop/core-enrollments';
import type { Modules } from '../modules.ts';
import { addMessageService } from './addMessage.ts';

export async function suspendEnrollmentService(
  this: Modules,
  enrollment: Enrollment,
  { resumeAt }: { resumeAt?: Date } = {},
) {
  if (enrollment.status === EnrollmentStatus.TERMINATED) return enrollment;

  let updatedEnrollment = (await this.enrollments.updateStatus(enrollment._id, {
    status: EnrollmentStatus.SUSPENDED,
    info: 'suspended manually',
  })) as Enrollment;

  if (resumeAt) {
    updatedEnrollment = (await this.enrollments.updateResumeAt(enrollment._id, resumeAt)) as Enrollment;
  }

  const user = await this.users.findUserById(enrollment.userId);
  const locale = this.users.userLocale(user);

  await addMessageService.bind(this)('ENROLLMENT_STATUS', {
    reason: 'status_change',
    locale: locale.baseName,
    enrollmentId: updatedEnrollment._id,
  });

  return updatedEnrollment;
}
