import { Enrollment, EnrollmentStatus } from '@unchainedshop/core-enrollments';
import { Modules } from '../modules.js';
import { EnrollmentDirector } from '../core-index.js';

const findNextStatus = async (
  enrollment: Enrollment,
  unchainedAPI: { modules: Modules },
): Promise<EnrollmentStatus> => {
  let status = enrollment.status;
  const director = await EnrollmentDirector.actions({ enrollment }, unchainedAPI);

  if (status === EnrollmentStatus.INITIAL || status === EnrollmentStatus.PAUSED) {
    if (await director.isValidForActivation()) {
      status = EnrollmentStatus.ACTIVE;
    }
  } else if (status === EnrollmentStatus.ACTIVE) {
    if (await director.isOverdue()) {
      status = EnrollmentStatus.PAUSED;
    }
  } else if (unchainedAPI.modules.enrollments.isExpired(enrollment, {})) {
    status = EnrollmentStatus.TERMINATED;
  }

  return status;
};

export const processEnrollmentService = async (
  enrollment: Enrollment,
  unchainedAPI: { modules: Modules },
) => {
  const status = await findNextStatus(enrollment, unchainedAPI);

  if (status === EnrollmentStatus.ACTIVE) {
    // const nextEnrollment = await reactivateEnrollment(enrollment);
    // TODO: Reactivate!
    // status = await findNextStatus(nextEnrollment, unchainedAPI);
  }

  return unchainedAPI.modules.enrollments.updateStatus(enrollment._id, {
    status,
    info: 'enrollment processed',
  });
};
