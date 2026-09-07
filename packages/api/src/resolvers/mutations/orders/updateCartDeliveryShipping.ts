import type { Context } from '../../../context.ts';
import { DeliveryProviderType } from '@unchainedshop/core-delivery';
import { log } from '@unchainedshop/logger';
import { InvalidIdError, OrderNotFoundError } from '../../../errors.ts';
import { rethrowDeliveryProviderServiceError } from './mapOrderServiceError.ts';

export default async function updateCartDeliveryShipping(
  root: never,
  params: { orderId: string; deliveryProviderId: string; address: any; meta: any },
  context: Context,
) {
  const { services, userId, user } = context;
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

  try {
    return await services.orders.selectDeliveryProvider({
      orderId: order._id,
      deliveryProviderId,
      expectedType: DeliveryProviderType.SHIPPING,
      deliveryContext: { address, meta },
    });
  } catch (error) {
    rethrowDeliveryProviderServiceError(error);
  }
}
