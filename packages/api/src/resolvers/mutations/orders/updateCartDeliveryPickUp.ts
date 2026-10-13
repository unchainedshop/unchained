import type { Context } from '../../../context.ts';
import { DeliveryProviderType } from '@unchainedshop/core-delivery';
import { log } from '@unchainedshop/logger';
import { InvalidIdError, mapServiceError, deliveryProviderErrors } from '../../../errors.ts';
import { lockCart } from '../../loadCart.ts';

export default async function updateCartDeliveryPickUp(
  root: never,
  params: { orderId: string; deliveryProviderId: string; orderPickUpLocationId: string; meta: any },
  context: Context,
) {
  const { services, userId } = context;
  const { orderId, deliveryProviderId, orderPickUpLocationId, meta } = params;
  log(`mutation updateCartDeliveryPickUp provider ${deliveryProviderId}`, { userId });

  if (!deliveryProviderId) throw new InvalidIdError({ deliveryProviderId });

  await using order = await lockCart(context, orderId);

  try {
    await services.orders.selectDeliveryProvider({
      order,
      deliveryProviderId,
      expectedType: DeliveryProviderType.PICKUP,
      deliveryContext: { orderPickUpLocationId, meta },
    });
  } catch (error) {
    throw mapServiceError(error, deliveryProviderErrors);
  }
  return await services.orders.updateCalculation(order._id);
}
