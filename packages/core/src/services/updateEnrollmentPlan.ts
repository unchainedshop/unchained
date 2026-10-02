import type { Enrollment, EnrollmentPlan } from '@unchainedshop/core-enrollments';
import { emit } from '@unchainedshop/events';
import { EnrollmentDirector } from '../core-index.ts';
import { processEnrollmentService } from './processEnrollment.ts';
import { addMessageService } from './addMessage.ts';
import { createServiceError } from '../errors.ts';
import type { Modules } from '../modules.ts';

// Billed periods stay as they are, the next period is generated from the new plan
export async function updateEnrollmentPlanService(
  this: Modules,
  enrollment: Enrollment,
  { plan }: { plan: EnrollmentPlan },
) {
  const product = await this.products.findProduct({ productId: enrollment.productId });
  if (!product) throw createServiceError('ProductNotFoundError', 'Product not found for enrollment');

  const director = await EnrollmentDirector.actions({ enrollment, product }, { modules: this });
  const newPlan = await director.transformPlanToNewPlan({ plan });
  if (!newPlan) {
    throw createServiceError(
      'EnrollmentPlanChangeNotSupportedError',
      'Plan change is not supported for this enrollment',
    );
  }

  let updatedEnrollment = (await this.enrollments.updatePlan(enrollment._id, newPlan)) as Enrollment;
  updatedEnrollment = await processEnrollmentService.bind(this)(updatedEnrollment);

  await emit('ENROLLMENT_PLAN_CHANGE', { enrollment: updatedEnrollment });

  const user = await this.users.findUserById(enrollment.userId);
  const locale = this.users.userLocale(user);

  await addMessageService.bind(this)('ENROLLMENT_STATUS', {
    reason: 'plan_change',
    locale: locale.baseName,
    enrollmentId: updatedEnrollment._id,
  });

  return updatedEnrollment;
}
