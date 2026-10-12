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
  if (expectedType && provider.type !== expectedType) {
    throw createServiceError('DeliveryProviderTypeError', 'Delivery provider has the wrong type', {
      orderId: order._id,
      received: provider.type,
      required: expectedType,
    });
  }

  const supportedProviders = await supportedDeliveryProvidersService.bind(this)({ order });
  if (!supportedProviders.some(({ _id }) => _id === deliveryProviderId)) {
    throw createServiceError(
      'DeliveryProviderNotSupportedError',
      'Delivery provider is not supported for this cart',
      { orderId: order._id, deliveryProviderId },
    );
  }

  const updatedOrder = (await this.orders.setDeliveryProvider(order._id, deliveryProviderId)) || order;
  if (!updatedOrder.deliveryId) {
    throw createServiceError('OrderDeliveryNotFoundError', 'Order delivery not found', {
      orderId: order._id,
    });
  }
  if (deliveryContext) {
    await this.orders.deliveries.updateContext(updatedOrder.deliveryId, deliveryContext);
  }
  return updatedOrder;
}
