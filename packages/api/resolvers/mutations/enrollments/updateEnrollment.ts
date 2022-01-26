import { log } from 'meteor/unchained:logger';
import { EnrollmentStatus } from 'meteor/unchained:core-enrollments';
import { Context, Root } from '@unchainedshop/types/api';
import { EnrollmentPlan, Enrollment } from '@unchainedshop/types/enrollments';
import { Address, Contact } from '@unchainedshop/types/common';
import {
  EnrollmentNotFoundError,
  EnrollmentWrongStatusError,
  InvalidIdError,
} from '../../../errors';

type UpdateEnrollmentParams = {
  enrollmentId: string;
  contact?: Contact;
  plan: EnrollmentPlan;
  billingAddress: Address;
  payment?: Enrollment['payment'];
  delivery?: Enrollment['delivery'];
  meta?: any;
};
export default async function updateEnrollment(
  root: Root,
  params: UpdateEnrollmentParams,
  context: Context
) {
  const { modules, userId } = context;
  const {
    billingAddress,
    contact,
    delivery,
    enrollmentId,
    meta,
    payment,
    plan,
  } = params;

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
    enrollment = await modules.enrollments.updateContext(
      enrollmentId,
      meta,
      userId
    );
  }

  if (billingAddress) {
    enrollment = await modules.enrollments.updateBillingAddress(
      enrollmentId,
      billingAddress,
      userId
    );
  }

  if (contact) {
    enrollment = await modules.enrollments.updateContact(
      enrollmentId,
      contact,
      userId
    );
  }

  if (payment) {
    enrollment = await modules.enrollments.updatePayment(
      enrollmentId,
      payment,
      userId
    );
  }

  if (delivery) {
    enrollment = await modules.enrollments.updateDelivery(
      enrollmentId,
      delivery,
      userId
    );
  }

  if (plan) {
    if (enrollment.status !== EnrollmentStatus.INITIAL) {
      // If Enrollment is not initial, forcefully add a new Period that OVERLAPS the existing periods
      throw new Error(
        'TODO: Unchained currently does not support order splitting for enrollments, therefore updates to quantity, product and configuration of a enrollment is forbidden for non initial enrollments'
      );
    }
    enrollment = await modules.enrollments.updatePlan(
      enrollmentId,
      plan,
      context
    );
  }

  return enrollment;
}
