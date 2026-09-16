import { type Enrollment, EnrollmentStatus } from '@unchainedshop/core-enrollments';
import { emit } from '@unchainedshop/events';
import type { Modules } from '../modules.ts';
import { addMessageService } from './addMessage.ts';

export async function suspendEnrollmentService(
  this: Modules,
  enrollment: Enrollment,
  params?: { resumeAt?: Date },
) {
  if (
    enrollment.status === EnrollmentStatus.TERMINATED ||
    enrollment.status === EnrollmentStatus.INITIAL ||
    enrollment.status === EnrollmentStatus.SUSPENDED
  )
    throw new Error(`Cannot suspend enrollment with status ${enrollment.status}`);

  let updatedEnrollment = (await this.enrollments.updateStatus(enrollment._id, {
    status: EnrollmentStatus.SUSPENDED,
    info: params?.resumeAt
      ? `suspended manually, scheduled resume at ${params.resumeAt.toISOString()}`
      : 'suspended manually',
  })) as Enrollment;

  if (params?.resumeAt) {
    updatedEnrollment = (await this.enrollments.updateResumeAt(
      enrollment._id,
      params.resumeAt,
    )) as Enrollment;
  }

  await emit('ENROLLMENT_SUSPEND', { enrollment: updatedEnrollment });

  const user = await this.users.findUserById(enrollment.userId);
  const locale = this.users.userLocale(user);

  await addMessageService.bind(this)('ENROLLMENT_STATUS', {
    reason: 'status_change',
    locale: locale.baseName,
    enrollmentId: updatedEnrollment._id,
  });

  return updatedEnrollment;
}
