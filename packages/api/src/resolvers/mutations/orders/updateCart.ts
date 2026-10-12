import { log } from '@unchainedshop/logger';
import type { Context } from '../../../context.ts';
import { InvalidIdError, OrderNotFoundError, OrderWrongStatusError } from '../../../errors.ts';
import { rethrowDeliveryProviderError, rethrowPaymentProviderError } from './mapOrderServiceError.ts';
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

  const { modules, services, userId, user } = context;

  log('mutation updateCart', { userId });

  // Validate IDs - throw error for empty strings
  if (orderId === '') throw new InvalidIdError({ orderId });
  if (paymentProviderId === '') throw new InvalidIdError({ paymentProviderId });
  if (deliveryProviderId === '') throw new InvalidIdError({ deliveryProviderId });

  let order = await services.orders.findOrInitCart({
    orderId,
    user: user!,
    countryCode: context.countryCode,
  });
  if (!order) throw new OrderNotFoundError({ orderId });
  if (!modules.orders.isCart(order)) throw new OrderWrongStatusError({ status: order.status });

  // Batch update non-provider fields in a single database operation
  if (meta || billingAddress || contact) {
    order =
      (await modules.orders.updateCartFields(order._id, { meta, billingAddress, contact })) || order;
  }

  // Provider updates trigger events and need to be handled separately
  if (deliveryProviderId) {
    order = await services.orders
      .selectDeliveryProvider({ order, deliveryProviderId })
      .catch(rethrowDeliveryProviderError);
  }

  if (paymentProviderId) {
    order = await services.orders
      .selectPaymentProvider({ order, paymentProviderId })
      .catch(rethrowPaymentProviderError);
  }

  // Recalculate, then return
  return services.orders.updateCalculation(order._id);
}
