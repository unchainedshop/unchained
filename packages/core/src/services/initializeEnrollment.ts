import { Enrollment } from '@unchainedshop/core-enrollments';
import { EnrollmentDirector } from '../core-index.js';
import { processEnrollmentService } from './processEnrollment.js';
import { Modules } from '../modules.js';

export async function initializeEnrollmentService(
  this: Modules,
  enrollment: Enrollment,
  params: { orderIdForFirstPeriod?: string; reason: string },
) {
  const director = await EnrollmentDirector.actions({ enrollment }, { modules: this });
  const period = await director.nextPeriod();

  let updatedEnrollment = enrollment;
  if (period && (params.orderIdForFirstPeriod || period.isTrial)) {
    updatedEnrollment = await this.enrollments.addEnrollmentPeriod(enrollment._id, {
      ...period,
      orderId: params.orderIdForFirstPeriod,
    });
  }

  const processedEnrollment = await processEnrollmentService.bind(this)(updatedEnrollment);
  const user = await this.users.findUserById(enrollment.userId);
  const locale = this.users.userLocale(user);

  await this.worker.addWork({
    type: 'MESSAGE',
    retries: 0,
    input: {
      reason: params.reason || 'status_change',
      locale,
      template: 'ENROLLMENT_STATUS',
      enrollmentId: processedEnrollment._id,
    },
  });

  return processedEnrollment;
}
