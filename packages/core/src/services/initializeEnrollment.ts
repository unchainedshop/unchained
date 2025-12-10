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
  const period = await director.nextPeriod();

  let updatedEnrollment = enrollment;
  if (period && (params.orderIdForFirstPeriod || period.isTrial)) {
    updatedEnrollment = (await this.enrollments.addEnrollmentPeriod(enrollment._id, {
      ...period,
      orderId: params.orderIdForFirstPeriod,
    })) as Enrollment;
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
