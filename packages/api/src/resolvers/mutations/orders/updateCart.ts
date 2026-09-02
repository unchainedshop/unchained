import { log } from '@unchainedshop/logger';
import type { Order } from '@unchainedshop/core-orders';
import type { Context } from '../../../context.ts';
import { InvalidIdError, OrderNotFoundError, OrderWrongStatusError } from '../../../errors.ts';
import {
  rethrowDeliveryProviderServiceError,
  rethrowPaymentProviderServiceError,
} from './mapOrderServiceError.ts';

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

  if (paymentProviderId) {
    try {
      order = await services.orders.selectPaymentProvider({
        orderId: order._id,
        paymentProviderId,
      });
    } catch (error) {
      rethrowPaymentProviderServiceError(error, { generic: true });
    }
  }

  if (deliveryProviderId) {
    try {
      order = await services.orders.selectDeliveryProvider({
        orderId: order._id,
        deliveryProviderId,
      });
    } catch (error) {
      rethrowDeliveryProviderServiceError(error, { generic: true });
    }
  }

  return paymentProviderId || deliveryProviderId ? order : services.orders.updateCalculation(order._id);
}
