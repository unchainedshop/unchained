import { type Enrollment, EnrollmentStatus } from '@unchainedshop/core-enrollments';
import type { Modules } from '../modules.ts';
import { EnrollmentDirector } from '../core-index.ts';

const findNextStatus = async (
  enrollment: Enrollment,
  modules: Modules,
): Promise<EnrollmentStatus | null> => {
  let status = enrollment.status;
  const product = await modules.products.findProduct({
    productId: enrollment.productId,
  });

  if (!product) throw new Error('Product not found for enrollment');

  const director = await EnrollmentDirector.actions({ enrollment, product }, { modules });

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

  if (status) {
    return this.enrollments.updateStatus(enrollment._id, {
      status,
      info: 'enrollment processed',
    }) as Promise<Enrollment>;
  }
  return enrollment;
}
