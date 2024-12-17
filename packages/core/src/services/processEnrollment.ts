import { Enrollment, EnrollmentStatus } from '@unchainedshop/core-enrollments';
import { Modules } from '../modules.js';
import { EnrollmentDirector } from '../core-index.js';

const findNextStatus = async (enrollment: Enrollment, modules: Modules): Promise<EnrollmentStatus> => {
  let status = enrollment.status;
  const director = await EnrollmentDirector.actions({ enrollment }, { modules });

  if (status === EnrollmentStatus.INITIAL || status === EnrollmentStatus.PAUSED) {
    if (await director.isValidForActivation()) {
      status = EnrollmentStatus.ACTIVE;
    }
  } else if (status === EnrollmentStatus.ACTIVE) {
    if (await director.isOverdue()) {
      status = EnrollmentStatus.PAUSED;
    }
  } else if (modules.enrollments.isExpired(enrollment, {})) {
    status = EnrollmentStatus.TERMINATED;
  }

  return status;
};

export async function processEnrollmentService(this: Modules, enrollment: Enrollment) {
  const status = await findNextStatus(enrollment, this);

  if (status === EnrollmentStatus.ACTIVE) {
    // const nextEnrollment = await reactivateEnrollment(enrollment);
    // TODO: Reactivate!
    // status = await findNextStatus(nextEnrollment, unchainedAPI);
  }

  return this.enrollments.updateStatus(enrollment._id, {
    status,
    info: 'enrollment processed',
  });
}
