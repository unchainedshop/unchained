import type { DeliveryProviderType } from '@unchainedshop/core-delivery';
import type { Order } from '@unchainedshop/core-orders';
import type { Modules } from '../modules.ts';
import { createServiceError } from '../errors.ts';
import { supportedDeliveryProvidersService } from './supportedDeliveryProviders.ts';

export async function selectDeliveryProviderService(
  this: Modules,
  {
    order,
    deliveryProviderId,
    expectedType,
    deliveryContext,
  }: {
    order: Order;
    deliveryProviderId: string;
    expectedType?: DeliveryProviderType;
    deliveryContext?: Record<string, unknown>;
  },
): Promise<Order> {
  const provider = await this.delivery.findProvider({ deliveryProviderId });
  if (!provider) {
    throw createServiceError('DeliveryProviderNotFoundError', 'Delivery provider not found', {
      deliveryProviderId,
    });
  }
  const supportedProviders = await supportedDeliveryProvidersService.call(this, { order });
  const isSupported = supportedProviders.some(({ _id }) => _id === provider._id);
  if (!isSupported || (expectedType && provider.type !== expectedType)) {
    throw createServiceError('DeliveryProviderNotSupportedError', 'Delivery provider not supported', {
      orderId: order._id,
      received: provider.type,
      required: expectedType,
    });
  }

  const updatedOrder = (await this.orders.setDeliveryProvider(order._id, deliveryProviderId)) || order;
  if (deliveryContext) {
    await this.orders.deliveries.updateContext(updatedOrder.deliveryId!, deliveryContext);
  }
  return updatedOrder;
}
