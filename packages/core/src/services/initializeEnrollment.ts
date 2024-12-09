import { Enrollment } from '@unchainedshop/core-enrollments';
import { Modules } from '../modules.js';
import { EnrollmentDirector } from '../core-index.js';
import { processEnrollmentService } from './processEnrollment.js';

export const initializeEnrollmentService = async (
  enrollment: Enrollment,
  params: { orderIdForFirstPeriod?: string; reason: string },
  unchainedAPI: { modules: Modules },
) => {
  const { modules } = unchainedAPI;

  const director = await EnrollmentDirector.actions({ enrollment }, unchainedAPI);
  const period = await director.nextPeriod();

  let updatedEnrollment = enrollment;
  if (period && (params.orderIdForFirstPeriod || period.isTrial)) {
    updatedEnrollment = await modules.enrollments.addEnrollmentPeriod(enrollment._id, {
      ...period,
      orderId: params.orderIdForFirstPeriod,
    });
  }

  const processedEnrollment = await processEnrollmentService(updatedEnrollment, unchainedAPI);

  const user = await modules.users.findUserById(enrollment.userId);
  const locale = modules.users.userLocale(user);

  await modules.worker.addWork({
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
};
