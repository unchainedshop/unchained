import { log } from 'unchained-logger';
import {
  Enrollments,
  EnrollmentStatus,
} from 'meteor/unchained:core-enrollments';
import {
  EnrollmentNotFoundError,
  EnrollmentWrongStatusError,
  InvalidIdError,
} from '../../errors';

export default async function updateEnrollment(
  root,
  { enrollmentId, contact, plan, billingAddress, payment, delivery, meta },
  { userId }
) {
  log('mutation updateEnrollment', { userId });
  if (!enrollmentId) throw new InvalidIdError({ enrollmentId });
  const enrollment = Enrollments.findEnrollment({ enrollmentId });
  if (!enrollment) {
    throw new EnrollmentNotFoundError({
      enrollmentId,
    });
  }
  if (enrollment.status === EnrollmentStatus.TERMINATED) {
    throw new EnrollmentWrongStatusError({ status: enrollment.status });
  }
  if (meta) {
    Enrollments.updateContext({ meta, enrollmentId });
  }
  if (billingAddress) {
    Enrollments.updateBillingAddress({ billingAddress, enrollmentId });
  }
  if (contact) {
    Enrollments.updateContact({ contact, enrollmentId });
  }
  if (payment) {
    Enrollments.updatePayment({ payment, enrollmentId });
  }
  if (delivery) {
    Enrollments.updateDelivery({ delivery, enrollmentId });
  }
  if (plan) {
    if (enrollment.status !== EnrollmentStatus.INITIAL) {
      // If Enrollment is not initial, forcefully add a new Period that OVERLAPS the existing periods
      throw new Error(
        'TODO: Unchained currently does not support order splitting for enrollments, therefore updates to quantity, product and configuration of a enrollment is forbidden for non initial enrollments'
      );
    }
    await Enrollments.updatePlan({ plan, enrollmentId });
  }
  return Enrollments.findEnrollment({ enrollmentId });
}
