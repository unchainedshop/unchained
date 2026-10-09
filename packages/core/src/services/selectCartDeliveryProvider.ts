import { DeliveryProviderType } from '@unchainedshop/core-delivery';
import type { Modules } from '../modules.ts';
import { createServiceError } from '../errors.ts';
import { supportedDeliveryProvidersService } from './supportedDeliveryProviders.ts';
import { updateCalculationService } from './updateCalculation.ts';

export async function selectCartDeliveryProviderService(
  this: Modules,
  {
    orderId,
    deliveryProviderId,
    expectedType,
    deliveryContext,
  }: {
    orderId: string;
    deliveryProviderId: string;
    expectedType?: (typeof DeliveryProviderType)[keyof typeof DeliveryProviderType];
    deliveryContext?: Record<string, unknown>;
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

  const provider = await this.delivery.findProvider({ deliveryProviderId });
  if (!provider) {
    throw createServiceError('DeliveryProviderNotFoundError', 'Delivery provider not found', {
      deliveryProviderId,
    });
  }
  if (expectedType && provider.type !== expectedType) {
    throw createServiceError('DeliveryProviderTypeError', 'Delivery provider has the wrong type', {
      orderId,
      received: provider.type,
      required: expectedType,
    });
  }

  const supportedProviders = await supportedDeliveryProvidersService.bind(this)({ order });
  if (!supportedProviders.some(({ _id }) => _id === deliveryProviderId)) {
    throw createServiceError(
      'DeliveryProviderNotSupportedError',
      'Delivery provider is not supported for this cart',
      { orderId, deliveryProviderId },
    );
  }

  order = (await this.orders.setDeliveryProvider(orderId, deliveryProviderId)) || order;
  if (!order.deliveryId) {
    throw createServiceError('OrderDeliveryNotFoundError', 'Order delivery not found', { orderId });
  }
  if (deliveryContext !== undefined) {
    await this.orders.deliveries.updateContext(order.deliveryId, deliveryContext);
  }

  return updateCalculationService.bind(this)(orderId);
}

export { DeliveryProviderType };
