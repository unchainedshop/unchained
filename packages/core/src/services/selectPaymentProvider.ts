import type { PaymentProviderType } from '@unchainedshop/core-payment';
import type { Order } from '@unchainedshop/core-orders';
import type { Modules } from '../modules.ts';
import { createServiceError } from '../errors.ts';
import { supportedPaymentProvidersService } from './supportedPaymentProviders.ts';

export async function selectPaymentProviderService(
  this: Modules,
  {
    order,
    paymentProviderId,
    expectedType,
    paymentContext,
  }: {
    order: Order;
    paymentProviderId: string;
    expectedType?: PaymentProviderType;
    paymentContext?: Record<string, unknown>;
  },
): Promise<Order> {
  const provider = await this.payment.paymentProviders.findProvider({ paymentProviderId });
  if (!provider) {
    throw createServiceError('PaymentProviderNotFoundError', 'Payment provider not found', {
      paymentProviderId,
    });
  }
  if (expectedType && provider.type !== expectedType) {
    throw createServiceError('PaymentProviderTypeError', 'Payment provider has the wrong type', {
      orderId: order._id,
      received: provider.type,
      required: expectedType,
    });
  }

  const supportedProviders = await supportedPaymentProvidersService.bind(this)({ order });
  if (!supportedProviders.some(({ _id }) => _id === paymentProviderId)) {
    throw createServiceError(
      'PaymentProviderNotSupportedError',
      'Payment provider is not supported for this cart',
      { orderId: order._id, paymentProviderId },
    );
  }

  const updatedOrder = (await this.orders.setPaymentProvider(order._id, paymentProviderId)) || order;
  if (!updatedOrder.paymentId) {
    throw createServiceError('OrderPaymentNotFoundError', 'Order payment not found', {
      orderId: order._id,
    });
  }
  if (paymentContext) {
    await this.orders.payments.updateContext(updatedOrder.paymentId, paymentContext);
  }
  return updatedOrder;
}
