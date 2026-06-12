import type { Enrollment } from '@unchainedshop/core-enrollments';
import { EnrollmentDirector } from '../core-index.ts';
import { processEnrollmentService } from './processEnrollment.ts';
import type { Modules } from '../modules.ts';
import { addMessageService } from './addMessage.ts';

export async function initializeEnrollmentService(
  this: Modules,
  enrollment: Enrollment,
  params: { orderIdForFirstPeriod?: string; reason: string },
) {
  const product = await this.products.findProduct({
    productId: enrollment.productId,
  });

  const director = await EnrollmentDirector.actions(
    { enrollment, product: product! },
    { modules: this },
  );

  const periods = await director.initialPeriods({ referenceDate: new Date() });

  let updatedEnrollment = enrollment;

  if (periods.length > 0) {
    const [firstPeriod, ...remainingPeriods] = periods;

    if (params.orderIdForFirstPeriod || firstPeriod.isTrial) {
      updatedEnrollment = (await this.enrollments.addEnrollmentPeriod(enrollment._id, {
        ...firstPeriod,
        orderId: params.orderIdForFirstPeriod,
      })) as Enrollment;
    }

    if (remainingPeriods.length > 0) {
      updatedEnrollment = (await this.enrollments.addEnrollmentPeriods(
        enrollment._id,
        remainingPeriods,
      )) as Enrollment;
    }
  }

  const expiryDate = await director.expiryDate();
  if (expiryDate) {
    updatedEnrollment = (await this.enrollments.updateExpiry(enrollment._id, expiryDate)) as Enrollment;
  }

  const processedEnrollment = await processEnrollmentService.bind(this)(updatedEnrollment);
  const user = await this.users.findUserById(enrollment.userId);
  const locale = this.users.userLocale(user!);

  await addMessageService.bind(this)('ENROLLMENT_STATUS', {
    reason: 'status_change',
    locale: locale.baseName,
    enrollmentId: processedEnrollment._id,
  });

  return processedEnrollment;
}
