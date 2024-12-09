import { Enrollment, EnrollmentStatus } from '@unchainedshop/core-enrollments';
import { Modules } from '../modules.js';
import { processEnrollmentService } from './processEnrollment.js';

export const terminateEnrollmentService = async (
  enrollment: Enrollment,
  unchainedAPI: { modules: Modules },
) => {
  if (enrollment.status === EnrollmentStatus.TERMINATED) return enrollment;

  let updatedEnrollment = await unchainedAPI.modules.enrollments.updateStatus(enrollment._id, {
    status: EnrollmentStatus.TERMINATED,
    info: 'terminated manually',
  });

  updatedEnrollment = await processEnrollmentService(updatedEnrollment, unchainedAPI);

  const { modules } = unchainedAPI;

  const user = await modules.users.findUserById(enrollment.userId);
  const locale = modules.users.userLocale(user);

  await modules.worker.addWork({
    type: 'MESSAGE',
    retries: 0,
    input: {
      reason: 'status_change',
      locale,
      template: 'ENROLLMENT_STATUS',
      enrollmentId: updatedEnrollment._id,
    },
  });

  return updatedEnrollment;
};
