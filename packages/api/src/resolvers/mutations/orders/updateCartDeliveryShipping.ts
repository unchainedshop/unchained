import type { Context } from '../../../context.ts';
import { DeliveryProviderType } from '@unchainedshop/core-delivery';
import { log } from '@unchainedshop/logger';
import { InvalidIdError, rethrowDeliveryProviderError } from '../../../errors.ts';
import loadCart from './loadCart.ts';

export default async function updateCartDeliveryShipping(
  root: never,
  params: { orderId: string; deliveryProviderId: string; address: any; meta: any },
  context: Context,
) {
  const { services, userId } = context;
  const { orderId, deliveryProviderId, address, meta } = params;
  log(`mutation updateCartDeliveryShipping provider ${deliveryProviderId}`, { userId });

  if (!deliveryProviderId) throw new InvalidIdError({ deliveryProviderId });

  const order = await loadCart(context, orderId);

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
