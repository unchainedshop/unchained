import { Order, OrdersModule } from '@unchainedshop/core-orders';
import { DeliveryModule, deliverySettings } from '@unchainedshop/core-delivery';
import { PaymentModule, paymentSettings } from '@unchainedshop/core-payment';

export const initCartProvidersService = async (
  order: Order,
  unchainedAPI: {
    modules: {
      delivery: DeliveryModule;
      orders: OrdersModule;
      payment: PaymentModule;
    };
  },
) => {
  const { modules } = unchainedAPI;

  let updatedOrder = order;

  // Init delivery provider
  const supportedDeliveryProviders = await modules.delivery.findSupported(
    { order: updatedOrder },
    unchainedAPI,
  );

  const orderDelivery = await modules.orders.deliveries.findDelivery({
    orderDeliveryId: updatedOrder.deliveryId,
  });
  const deliveryProviderId = orderDelivery?.deliveryProviderId;

  const isAlreadyInitializedWithSupportedDeliveryProvider = supportedDeliveryProviders?.some(
    (provider) => {
      return provider._id === deliveryProviderId;
    },
  );

  if (supportedDeliveryProviders?.length > 0 && !isAlreadyInitializedWithSupportedDeliveryProvider) {
    const defaultOrderDeliveryProvider = await deliverySettings.determineDefaultProvider(
      {
        providers: supportedDeliveryProviders,
        order: updatedOrder,
      },
      unchainedAPI,
    );
    if (defaultOrderDeliveryProvider) {
      updatedOrder = await modules.orders.setDeliveryProvider(
        updatedOrder._id,
        defaultOrderDeliveryProvider._id,
        unchainedAPI,
      );
    }
  }

  // Init payment provider
  const supportedPaymentProviders = await modules.payment.paymentProviders.findSupported(
    { order: updatedOrder },
    unchainedAPI,
  );

  const orderPayment = await modules.orders.payments.findOrderPayment({
    orderPaymentId: updatedOrder.paymentId,
  });
  const paymentProviderId = orderPayment?.paymentProviderId;

  const isAlreadyInitializedWithSupportedPaymentProvider = supportedPaymentProviders?.some(
    (provider) => {
      return provider._id === paymentProviderId;
    },
  );

  if (supportedPaymentProviders?.length > 0 && !isAlreadyInitializedWithSupportedPaymentProvider) {
    const paymentCredentials = await modules.payment.paymentCredentials.findPaymentCredentials(
      { userId: updatedOrder.userId, isPreferred: true },
      {
        sort: {
          created: -1,
        },
      },
    );

    const defaultOrderPaymentProvider = await paymentSettings.determineDefaultProvider(
      {
        providers: supportedPaymentProviders,
        order: updatedOrder,
        paymentCredentials,
      },
      unchainedAPI,
    );

    if (defaultOrderPaymentProvider) {
      updatedOrder = await modules.orders.setPaymentProvider(
        updatedOrder._id,
        defaultOrderPaymentProvider._id,
        unchainedAPI,
      );
    }
  }
  return updatedOrder;
};
