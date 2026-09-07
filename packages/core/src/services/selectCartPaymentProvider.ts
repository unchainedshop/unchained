import { PaymentProviderType } from '@unchainedshop/core-payment';
import type { Modules } from '../modules.ts';
import { createServiceError } from '../errors.ts';
import { supportedPaymentProvidersService } from './supportedPaymentProviders.ts';
import { updateCalculationService } from './updateCalculation.ts';

export async function selectCartPaymentProviderService(
  this: Modules,
  {
    orderId,
    paymentProviderId,
    expectedType,
    paymentContext,
  }: {
    orderId: string;
    paymentProviderId: string;
    expectedType?: (typeof PaymentProviderType)[keyof typeof PaymentProviderType];
    paymentContext?: Record<string, unknown>;
  },
) {
  let order = await this.orders.findOrder({ orderId });
  if (!order) {
    throw createServiceError('OrderNotFoundError', 'Order not found', { orderId });
  }
  if (!this.orders.isCart(order)) {
    throw createServiceError('OrderWrongStatusError', 'Order is not a cart', {
      orderId,
      status: order.status,
    });
  }

  const provider = await this.payment.paymentProviders.findProvider({ paymentProviderId });
  if (!provider) {
    throw createServiceError('PaymentProviderNotFoundError', 'Payment provider not found', {
      paymentProviderId,
    });
  }
  if (expectedType && provider.type !== expectedType) {
    throw createServiceError('PaymentProviderTypeError', 'Payment provider has the wrong type', {
      orderId,
      received: provider.type,
      required: expectedType,
    });
  }

  const supportedProviders = await supportedPaymentProvidersService.bind(this)({ order });
  if (!supportedProviders.some(({ _id }) => _id === paymentProviderId)) {
    throw createServiceError(
      'PaymentProviderNotSupportedError',
      'Payment provider is not supported for this cart',
      { orderId, paymentProviderId },
    );
  }

  order = (await this.orders.setPaymentProvider(orderId, paymentProviderId)) || order;
  if (!order.paymentId) {
    throw createServiceError('OrderPaymentNotFoundError', 'Order payment not found', { orderId });
  }
  if (paymentContext !== undefined) {
    await this.orders.payments.updateContext(order.paymentId, paymentContext);
  }

  return updateCalculationService.bind(this)(orderId);
}

export { PaymentProviderType };
