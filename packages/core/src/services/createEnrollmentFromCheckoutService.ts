import { Enrollment, EnrollmentDirector, EnrollmentsModule } from '@unchainedshop/core-enrollments';
import { Order, OrderPosition, OrdersModule } from '@unchainedshop/core-orders';
import { Product } from '@unchainedshop/core-products';

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
  unchainedAPI: { modules: { orders: OrdersModule; enrollments: EnrollmentsModule } },
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
