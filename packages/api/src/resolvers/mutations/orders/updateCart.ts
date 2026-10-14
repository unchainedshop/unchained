import { log } from '@unchainedshop/logger';
import type { Context } from '../../../context.ts';
import {
  InvalidIdError,
  mapServiceError,
  deliveryProviderErrors,
  paymentProviderErrors,
} from '../../../errors.ts';
import { lockCart } from '../../loadCart.ts';
import type { Order } from '@unchainedshop/core-orders';

interface UpdateCartParams {
  orderId?: string;
  billingAddress?: NonNullable<Order['billingAddress']>;
  contact?: NonNullable<Order['contact']>;
  paymentProviderId?: string;
  deliveryProviderId?: string;
  meta?: any;
}

export default async function updateCart(root: never, params: UpdateCartParams, context: Context) {
  const { orderId, billingAddress, contact, paymentProviderId, deliveryProviderId, meta } = params;

  const { modules, services, userId } = context;

  log('mutation updateCart', { userId });

  // Validate IDs - throw error for empty strings
  if (orderId === '') throw new InvalidIdError({ orderId });
  if (paymentProviderId === '') throw new InvalidIdError({ paymentProviderId });
  if (deliveryProviderId === '') throw new InvalidIdError({ deliveryProviderId });

  await using cart = await lockCart(context, orderId);
  let order: Order = cart;

  // Batch update non-provider fields in a single database operation
  if (meta || billingAddress || contact) {
    order =
      (await modules.orders.updateCartFields(order._id, { meta, billingAddress, contact })) || order;
  }

  // Provider updates trigger events and need to be handled separately
  if (deliveryProviderId) {
    try {
      order = await services.orders.selectDeliveryProvider({ order, deliveryProviderId });
    } catch (error) {
      throw mapServiceError(error, deliveryProviderErrors);
    }
  }

  if (paymentProviderId) {
    try {
      order = await services.orders.selectPaymentProvider({ order, paymentProviderId });
    } catch (error) {
      throw mapServiceError(error, paymentProviderErrors);
    }
  }

  return await services.orders.updateCalculation(order._id);
}
