import {
  type Enrollment,
  type EnrollmentTerminationReason,
  EnrollmentStatus,
} from '@unchainedshop/core-enrollments';
import { processEnrollmentService } from './processEnrollment.ts';
import { addMessageService } from './addMessage.ts';
import { EnrollmentDirector } from '../core-index.ts';
import { createServiceError } from '../errors.ts';
import type { Modules } from '../modules.ts';

export async function terminateEnrollmentService(
  this: Modules,
  enrollment: Enrollment,
  { reason, comment }: { reason?: EnrollmentTerminationReason; comment?: string } = {},
) {
  if (enrollment.status === EnrollmentStatus.TERMINATED) return enrollment;

  const product = await this.products.findProduct({ productId: enrollment.productId });
  if (!product) throw createServiceError('ProductNotFoundError', 'Product not found for enrollment');

  const director = await EnrollmentDirector.actions({ enrollment, product }, { modules: this });
  const terminationDate = await director.terminationDate({ referenceDate: new Date() });
  if (!terminationDate) {
    throw createServiceError(
      'EnrollmentTerminationNotAllowedError',
      'Enrollment termination is not allowed at this time',
    );
  }

  // Never before the minimum commitment ends, and never later than an end that is already set
  const expires = new Date(
    Math.min(
      Math.max(terminationDate.getTime(), enrollment.minimumCommitmentEnd?.getTime() ?? 0),
      enrollment.expires?.getTime() ?? Infinity,
    ),
  );

  if (reason || comment) {
    await this.enrollments.updateCancellation(enrollment._id, { reason, comment });
  }

  let updatedEnrollment: Enrollment;
  if (expires.getTime() > Date.now()) {
    updatedEnrollment = (await this.enrollments.updateExpiry(enrollment._id, expires)) as Enrollment;
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
