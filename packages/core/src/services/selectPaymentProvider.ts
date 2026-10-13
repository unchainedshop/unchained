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
  const supportedProviders = await supportedPaymentProvidersService.call(this, { order });
  const isSupported = supportedProviders.some(({ _id }) => _id === provider._id);
  if (!isSupported || (expectedType && provider.type !== expectedType)) {
    throw createServiceError('PaymentProviderNotSupportedError', 'Payment provider not supported', {
      orderId: order._id,
      received: provider.type,
      required: expectedType,
    });
  }

  const updatedOrder = (await this.orders.setPaymentProvider(order._id, paymentProviderId)) || order;
  if (paymentContext) {
    await this.orders.payments.updateContext(updatedOrder.paymentId!, paymentContext);
  }
  return updatedOrder;
}
