import { Order, OrderPosition } from '@unchainedshop/core-orders';
import { Product } from '@unchainedshop/core-products';
import { Enrollment } from '@unchainedshop/core-enrollments';
import { Modules } from '../modules.js';
import { EnrollmentDirector } from '../directors/index.js';
import { initializeEnrollmentService } from './initializeEnrollment.js';

export async function createEnrollmentFromCheckoutService(
  this: Modules,
  order: Order,
  {
    items,
    context,
  }: {
    items: {
      orderPosition: OrderPosition;
      product: Product;
    }[];
    context: {
      paymentContext?: any;
      deliveryContext?: any;
    };
  },
): Promise<Enrollment[]> {
  const orderId = order._id;

  const payment = await this.orders.payments.findOrderPayment({
    orderPaymentId: order.paymentId!,
  });
  const delivery = await this.orders.deliveries.findDelivery({
    orderDeliveryId: order.deliveryId!,
  });

  const template = {
    billingAddress: order.billingAddress!,
    contact: order.contact!,
    countryCode: order.countryCode,
    currencyCode: order.currencyCode,
    delivery: {
      deliveryProviderId: delivery!.deliveryProviderId,
      context: delivery!.context,
    },
    orderIdForFirstPeriod: orderId,
    payment: {
      paymentProviderId: payment!.paymentProviderId,
      context: payment!.context,
    },
    userId: order.userId,
    meta: order.context,
    ...context,
  };

  return (
    await Promise.all(
      items.map(async (item) => {
        const enrollmentData = await EnrollmentDirector.transformOrderItemToEnrollment(item, template, {
          modules: this,
        });

        const enrollment = await this.enrollments.create(enrollmentData);
        return await initializeEnrollmentService.bind(this)(enrollment, {
          orderIdForFirstPeriod: enrollment.orderIdForFirstPeriod,
          reason: 'new_enrollment',
        });
      }),
    )
  ).filter(Boolean) as Enrollment[];
}
