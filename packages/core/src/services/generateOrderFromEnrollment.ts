import type { Modules } from '../modules.ts';
import type { Enrollment, EnrollmentOrderPositionTemplate } from '@unchainedshop/core-enrollments';
import { updateCalculationService } from './updateCalculation.ts';
import { checkoutOrderService } from './checkoutOrder.ts';

export async function generateOrderFromEnrollmentService(
  this: Modules,
  enrollment: Enrollment,
  {
    orderPositionTemplates,
    orderContext,
  }: {
    orderPositionTemplates: EnrollmentOrderPositionTemplate[];
    orderContext?: any;
  },
) {
  if (!enrollment.payment || !enrollment.delivery) return null;

  const order = await this.orders.create({
    userId: enrollment.userId,
    currencyCode: enrollment.currencyCode,
    countryCode: enrollment.countryCode,
    contact: enrollment.contact,
    billingAddress: enrollment.billingAddress,
    originEnrollmentId: enrollment._id,
    context: orderContext,
  });
  const orderId = order._id;

  await Promise.all(
    orderPositionTemplates.map((orderPositionTemplate) =>
      this.orders.positions.addProductItem({
        ...orderPositionTemplate,
        orderId: order._id,
      }),
    ),
  );

  const { paymentProviderId, context: paymentContext } = enrollment.payment;
  if (paymentProviderId) {
    await this.orders.setPaymentProvider(orderId, paymentProviderId);
  }

  const { deliveryProviderId, context: deliveryContext } = enrollment.delivery;
  if (deliveryProviderId) {
    await this.orders.setDeliveryProvider(orderId, deliveryProviderId);
  }

  await updateCalculationService.bind(this)(orderId);
  return checkoutOrderService.bind(this)(order._id, {
    deliveryContext,
    paymentContext,
  });
}
