import { log } from '@unchainedshop/logger';
import { EnrollmentStatus } from '@unchainedshop/core-enrollments';
import type { Context } from '../../../context.ts';
import type { EnrollmentPlan, Enrollment } from '@unchainedshop/core-enrollments';
import { EnrollmentNotFoundError, EnrollmentWrongStatusError, InvalidIdError } from '../../../errors.ts';
import type { Address, Contact } from '@unchainedshop/mongodb';

interface UpdateEnrollmentParams {
  enrollmentId: string;
  contact?: Contact;
  plan: EnrollmentPlan;
  billingAddress: Address;
  payment?: Enrollment['payment'];
  delivery?: Enrollment['delivery'];
  meta?: any;
}
export default async function updateEnrollment(
  root: never,
  params: UpdateEnrollmentParams,
  context: Context,
) {
  const { modules, services, userId } = context;
  const { billingAddress, contact, delivery, enrollmentId, meta, payment, plan } = params;

  log('mutation updateEnrollment', { userId });

  if (!enrollmentId) throw new InvalidIdError({ enrollmentId });

  let enrollment = await modules.enrollments.findEnrollment({ enrollmentId });
  if (!enrollment) {
    throw new EnrollmentNotFoundError({
      enrollmentId,
    });
  }

  if (enrollment.status === EnrollmentStatus.TERMINATED) {
    throw new EnrollmentWrongStatusError({ status: enrollment.status });
  }

  if (meta) {
    enrollment = (await modules.enrollments.updateContext(enrollmentId, meta)) as Enrollment;
  }

  if (billingAddress) {
    enrollment = (await modules.enrollments.updateBillingAddress(
      enrollmentId,
      billingAddress,
    )) as Enrollment;
  }

  if (contact) {
    enrollment = (await modules.enrollments.updateContact(enrollmentId, contact)) as Enrollment;
  }

  if (payment) {
    enrollment = (await modules.enrollments.updatePayment(enrollmentId, payment)) as Enrollment;
  }

  if (delivery) {
    enrollment = (await modules.enrollments.updateDelivery(enrollmentId, delivery)) as Enrollment;
  }

  if (plan) {
    if (enrollment.status !== EnrollmentStatus.INITIAL) {
      // If Enrollment is not initial, forcefully add a new Period that OVERLAPS the existing periods
      throw new Error(
        'TODO: Unchained currently does not support order splitting for enrollments, therefore updates to quantity, product and configuration of a enrollment is forbidden for non initial enrollments',
      );
    }
    enrollment = (await modules.enrollments.updatePlan(enrollmentId, plan)) as Enrollment;
    enrollment = await services.enrollments.initializeEnrollment(enrollment, { reason: 'updated_plan' });
  }

  return enrollment;
}
