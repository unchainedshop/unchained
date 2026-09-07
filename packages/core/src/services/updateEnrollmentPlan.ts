import type { Enrollment, EnrollmentPlan } from '@unchainedshop/core-enrollments';
import { emit } from '@unchainedshop/events';
import { EnrollmentDirector } from '../core-index.ts';
import { processEnrollmentService } from './processEnrollment.ts';
import { addMessageService } from './addMessage.ts';
import type { Modules } from '../modules.ts';

export async function updateEnrollmentPlanService(
  this: Modules,
  enrollment: Enrollment,
  params: { plan: EnrollmentPlan },
) {
  const currentProduct = await this.products.findProduct({
    productId: enrollment.productId,
  });
  if (!currentProduct) throw new Error('Current product not found');

  const currentDirector = await EnrollmentDirector.actions(
    { enrollment, product: currentProduct },
    { modules: this },
  );

  const result = await currentDirector.transformPlanToNewPlan({
    plan: params.plan,
    referenceDate: new Date(),
  });

  if (!result) {
    throw new Error('Plan change is not supported for this enrollment');
  }

  const { plan: newPlan, effectiveDate } = result;

  const newProduct = await this.products.findProduct({
    productId: newPlan.productId,
  });
  if (!newProduct) throw new Error('New product not found');

  const retainedPeriods = enrollment.periods.filter(
    (period) => Boolean(period.orderId) || new Date(period.start).getTime() < effectiveDate.getTime(),
  );
  const candidateEnrollment: Enrollment = {
    ...enrollment,
    productId: newPlan.productId,
    quantity: newPlan.quantity,
    configuration: newPlan.configuration,
    periods: retainedPeriods,
  };

  const newDirector = await EnrollmentDirector.actions(
    { enrollment: candidateEnrollment, product: newProduct },
    { modules: this },
  );

  const newPeriods = await newDirector.initialPeriods({
    referenceDate: effectiveDate,
  });

  let updatedEnrollment = (await this.enrollments.updatePlanAndPeriods(enrollment._id, newPlan, [
    ...retainedPeriods,
    ...newPeriods,
  ])) as Enrollment;

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
