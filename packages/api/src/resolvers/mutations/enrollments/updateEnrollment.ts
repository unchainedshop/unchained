import { log } from '@unchainedshop/logger';
import { EnrollmentStatus } from '@unchainedshop/core-enrollments';
import { ProductStatus, ProductType } from '@unchainedshop/core-products';
import type { Context } from '../../../context.ts';
import type { EnrollmentPlan, Enrollment } from '@unchainedshop/core-enrollments';
import {
  EnrollmentNotFoundError,
  EnrollmentWrongStatusError,
  EnrollmentPlanChangeNotSupportedError,
  InvalidIdError,
  ProductNotFoundError,
  ProductWrongStatusError,
  ProductWrongTypeError,
} from '../../../errors.ts';
import type { Address, Contact } from '@unchainedshop/mongodb';

interface UpdateEnrollmentParams {
  enrollmentId: string;
  contact?: Contact;
  plan: EnrollmentPlan;
  billingAddress: Address;
  payment?: Enrollment['payment'];
  delivery?: Enrollment['delivery'];
  meta?: any;
  expires?: Date;
}
export default async function updateEnrollment(
  root: never,
  params: UpdateEnrollmentParams,
  context: Context,
) {
  const { modules, services, userId } = context;
  const { billingAddress, contact, delivery, enrollmentId, meta, payment, plan, expires } = params;

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

  if (plan && enrollment.status === EnrollmentStatus.SUSPENDED) {
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

  if (expires !== undefined) {
    enrollment = (await modules.enrollments.updateExpiry(enrollmentId, expires)) as Enrollment;
  }

  if (plan) {
    const planProduct = await modules.products.findProduct({ productId: plan.productId });
    if (!planProduct) throw new ProductNotFoundError({ productId: plan.productId });
    if (planProduct.status !== ProductStatus.ACTIVE)
      throw new ProductWrongStatusError({ status: planProduct.status });
    if (planProduct.type !== ProductType.PLAN_PRODUCT)
      throw new ProductWrongTypeError({ type: planProduct.type });

    if (enrollment.status !== EnrollmentStatus.INITIAL) {
      try {
        enrollment = await services.enrollments.updateEnrollmentPlan(enrollment, { plan });
      } catch (e) {
        if (e.message === 'Plan change is not supported for this enrollment') {
          throw new EnrollmentPlanChangeNotSupportedError({ enrollmentId });
        }
        throw e;
      }
    } else {
      enrollment = (await modules.enrollments.updatePlan(enrollmentId, plan)) as Enrollment;
      enrollment = await services.enrollments.initializeEnrollment(enrollment, {
        reason: 'updated_plan',
      });
    }
  }

  return enrollment;
}
