import type { Context } from '../../../context.ts';
import { DeliveryProviderType } from '@unchainedshop/core-delivery';
import { log } from '@unchainedshop/logger';
import { InvalidIdError, OrderNotFoundError, OrderWrongStatusError } from '../../../errors.ts';
import { rethrowDeliveryProviderError } from './mapOrderServiceError.ts';

export default async function updateCartDeliveryShipping(
  root: never,
  params: { orderId: string; deliveryProviderId: string; address: any; meta: any },
  context: Context,
) {
  const { modules, services, userId, user } = context;
  const { orderId, deliveryProviderId, address, meta } = params;
  log(`mutation updateCartDeliveryShipping provider ${deliveryProviderId}`, {
    userId,
  });

  if (!deliveryProviderId) throw new InvalidIdError({ deliveryProviderId });

  const order = await services.orders.findOrInitCart({
    orderId,
    user: user!,
    countryCode: context.countryCode,
  });
  if (!order) throw new OrderNotFoundError({ orderId });
  if (!modules.orders.isCart(order)) throw new OrderWrongStatusError({ status: order.status });

  await services.orders
    .selectDeliveryProvider({
      order,
      deliveryProviderId,
      expectedType: DeliveryProviderType.SHIPPING,
      deliveryContext: { address, meta },
    })
    .catch(rethrowDeliveryProviderError);
  return services.orders.updateCalculation(order._id);
}
