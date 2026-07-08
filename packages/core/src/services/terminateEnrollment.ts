import {
  type Enrollment,
  type EnrollmentTerminationReason,
  EnrollmentStatus,
} from '@unchainedshop/core-enrollments';
import { processEnrollmentService } from './processEnrollment.ts';
import { addMessageService } from './addMessage.ts';
import { EnrollmentDirector } from '../core-index.ts';
import type { Modules } from '../modules.ts';

export async function terminateEnrollmentService(
  this: Modules,
  enrollment: Enrollment,
  params?: { reason?: EnrollmentTerminationReason; comment?: string },
) {
  if (enrollment.status === EnrollmentStatus.TERMINATED) return enrollment;

  const product = await this.products.findProduct({ productId: enrollment.productId });
  if (!product) throw new Error('Product not found for enrollment');

  const director = await EnrollmentDirector.actions({ enrollment, product }, { modules: this });
  const terminationDate = await director.terminationDate({ referenceDate: new Date() });

  if (terminationDate === null) {
    throw new Error('Enrollment termination is not allowed at this time');
  }

  if (params?.reason || params?.comment) {
    await this.enrollments.updateCancellation(enrollment._id, {
      reason: params.reason,
      comment: params.comment,
    });
  }

  const now = new Date();
  let updatedEnrollment: Enrollment;

  if (terminationDate.getTime() > now.getTime()) {
    updatedEnrollment = (await this.enrollments.updateRequestedTerminationDate(
      enrollment._id,
      terminationDate,
    )) as Enrollment;
  } else {
    updatedEnrollment = (await this.enrollments.updateStatus(enrollment._id, {
      status: EnrollmentStatus.TERMINATED,
      info: 'terminated manually',
    })) as Enrollment;

    updatedEnrollment = await processEnrollmentService.bind(this)(updatedEnrollment);
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
