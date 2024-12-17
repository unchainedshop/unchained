import { Order } from '@unchainedshop/core-orders';
import { deliverySettings } from '@unchainedshop/core-delivery';
import { paymentSettings } from '@unchainedshop/core-payment';
import { supportedDeliveryProvidersService } from './supportedDeliveryProviders.js';
import { supportedPaymentProvidersService } from './supportedPaymentProviders.js';
import { Modules } from '../modules.js';

export async function initCartProvidersService(this: Modules, order: Order) {
  let updatedOrder = order;

  // Init delivery provider
  const supportedDeliveryProviders = await supportedDeliveryProvidersService.bind(this)({
    order: updatedOrder,
  });

  const orderDelivery = await this.orders.deliveries.findDelivery({
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
      { modules: this },
    );
    if (defaultOrderDeliveryProvider) {
      updatedOrder = await this.orders.setDeliveryProvider(
        updatedOrder._id,
        defaultOrderDeliveryProvider._id,
      );
    }
  }

  // Init payment provider
  const supportedPaymentProviders = await supportedPaymentProvidersService.bind(this)({
    order: updatedOrder,
  });

  const orderPayment = await this.orders.payments.findOrderPayment({
    orderPaymentId: updatedOrder.paymentId,
  });
  const paymentProviderId = orderPayment?.paymentProviderId;

  const isAlreadyInitializedWithSupportedPaymentProvider = supportedPaymentProviders?.some(
    (provider) => {
      return provider._id === paymentProviderId;
    },
  );

  if (supportedPaymentProviders?.length > 0 && !isAlreadyInitializedWithSupportedPaymentProvider) {
    const paymentCredentials = await this.payment.paymentCredentials.findPaymentCredentials(
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
      { modules: this },
    );

    if (defaultOrderPaymentProvider) {
      updatedOrder = await this.orders.setPaymentProvider(
        updatedOrder._id,
        defaultOrderPaymentProvider._id,
      );
    }
  }
  return updatedOrder;
}
