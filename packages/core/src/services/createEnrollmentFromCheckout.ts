import { Enrollment, EnrollmentDirector } from '@unchainedshop/core-enrollments';
import { Order, OrderPosition } from '@unchainedshop/core-orders';
import { Product } from '@unchainedshop/core-products';
import { Modules } from '../modules.js';

export const createEnrollmentFromCheckoutService = async (
  order: Order,
  {
    items,
    context,
  }: {
    items: Array<{
      orderPosition: OrderPosition;
      product: Product;
    }>;
    context: {
      paymentContext?: any;
      deliveryContext?: any;
    };
  },
  unchainedAPI: { modules: Modules },
): Promise<Array<Enrollment>> => {
  const { modules } = unchainedAPI;
  const orderId = order._id;

  const payment = await modules.orders.payments.findOrderPayment({
    orderPaymentId: order.paymentId,
  });
  const delivery = await modules.orders.deliveries.findDelivery({
    orderDeliveryId: order.deliveryId,
  });

  const template = {
    billingAddress: order.billingAddress,
    contact: order.contact,
    countryCode: order.countryCode,
    currencyCode: order.currency,
    delivery: {
      deliveryProviderId: delivery.deliveryProviderId,
      context: delivery.context,
    },
    orderIdForFirstPeriod: orderId,
    payment: {
      paymentProviderId: payment.paymentProviderId,
      context: payment.context,
    },
    userId: order.userId,
    meta: order.context,
    ...context,
  };

  return Promise.all(
    items.map(async (item) => {
      const enrollmentData = await EnrollmentDirector.transformOrderItemToEnrollment(
        item,
        template,
        unchainedAPI,
      );

      return modules.enrollments.create(enrollmentData, unchainedAPI);
    }),
  );
};
