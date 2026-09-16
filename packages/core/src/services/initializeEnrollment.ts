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
  const actionsFor = (current: Enrollment) =>
    EnrollmentDirector.actions({ enrollment: current, product: product! }, { modules: this });

  let director = await actionsFor(enrollment);
  let updatedEnrollment = enrollment;

  const [firstPeriod, ...remainingPeriods] = await director.initialPeriods({
    referenceDate: new Date(),
  });

  if (firstPeriod && (params.orderIdForFirstPeriod || firstPeriod.isTrial)) {
    updatedEnrollment = (await this.enrollments.addEnrollmentPeriods(enrollment._id, [
      { ...firstPeriod, orderId: params.orderIdForFirstPeriod },
      ...remainingPeriods,
    ])) as Enrollment;
    director = await actionsFor(updatedEnrollment);
  }

  const expiryDate = await director.expiryDate();
  if (expiryDate) {
    updatedEnrollment = (await this.enrollments.updateExpiry(enrollment._id, expiryDate)) as Enrollment;
  }

  const contractStartDate =
    updatedEnrollment.periods.find((period) => !period.isTrial)?.start || new Date();
  const commitmentEnd = await director.minimumCommitmentEnd({ referenceDate: contractStartDate });
  if (commitmentEnd) {
    await this.enrollments.updateContractStartDate(enrollment._id, contractStartDate);
    updatedEnrollment = (await this.enrollments.updateMinimumCommitmentEnd(
      enrollment._id,
      commitmentEnd,
    )) as Enrollment;
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
