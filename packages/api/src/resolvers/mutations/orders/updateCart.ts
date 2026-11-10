import { log } from '@unchainedshop/logger';
import type { Context } from '../../../context.ts';
import { InvalidIdError } from '../../../errors.ts';
import type { Address, Contact } from '@unchainedshop/mongodb';
import { lockCart } from '../../loadCart.ts';

interface UpdateCartParams {
  orderId?: string;
  billingAddress?: Address;
  contact?: Contact;
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

  await using order = await lockCart(context, orderId);

  // Batch update non-provider fields in a single database operation
  if (meta || billingAddress || contact) {
    await modules.orders.updateCartFields(order._id, { meta, billingAddress, contact });
  }

  // Provider updates trigger events and need to be handled separately
  if (paymentProviderId) {
    await modules.orders.setPaymentProvider(order._id, paymentProviderId);
  }

  if (deliveryProviderId) {
    await modules.orders.setDeliveryProvider(order._id, deliveryProviderId);
  }

  // Recalculate, then return
  return services.orders.updateCalculation(order._id);
}
