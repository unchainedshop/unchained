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

export async function resolveEnrollmentTerminationDateService(
  this: Modules,
  enrollment: Enrollment,
  params: { requestedDate?: Date; referenceDate?: Date } = {},
) {
  const product = await this.products.findProduct({ productId: enrollment.productId });
  if (!product) throw createServiceError('ProductNotFoundError', 'Product not found for enrollment');

  const director = await EnrollmentDirector.actions({ enrollment, product }, { modules: this });
  const terminationDate = await director.terminationDate({
    referenceDate: params.referenceDate || new Date(),
  });

  if (!terminationDate || !params.requestedDate) return terminationDate;
  return params.requestedDate.getTime() > terminationDate.getTime()
    ? params.requestedDate
    : terminationDate;
}

export async function terminateEnrollmentService(
  this: Modules,
  enrollment: Enrollment,
  params: { atPeriodEnd?: boolean; reason?: EnrollmentTerminationReason; comment?: string } = {},
) {
  if (enrollment.status === EnrollmentStatus.TERMINATED) return enrollment;

  const requestedDate = params.atPeriodEnd
    ? this.enrollments.currentPeriod(enrollment, {})?.end
    : undefined;
  let terminationDate = await resolveEnrollmentTerminationDateService.bind(this)(enrollment, {
    requestedDate,
  });

  if (!terminationDate) {
    throw createServiceError(
      'EnrollmentTerminationNotAllowedError',
      'Enrollment termination is not allowed at this time',
    );
  }

  // A termination that is already scheduled must never be pushed out by a repeated request.
  const scheduledDate = enrollment.requestedTerminationDate;
  if (scheduledDate && new Date(scheduledDate).getTime() < terminationDate.getTime()) {
    terminationDate = new Date(scheduledDate);
  }

  if (params.reason || params.comment) {
    await this.enrollments.updateCancellation(enrollment._id, {
      reason: params.reason,
      comment: params.comment,
    });
  }

  let updatedEnrollment: Enrollment;

  if (terminationDate.getTime() > Date.now()) {
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
