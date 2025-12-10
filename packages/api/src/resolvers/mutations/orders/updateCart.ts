import { log } from '@unchainedshop/logger';
import type { Context } from '../../../context.ts';
import { OrderNotFoundError, OrderWrongStatusError } from '../../../errors.ts';
import type { Address, Contact } from '@unchainedshop/mongodb';

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

  const { modules, services, userId, user } = context;

  log('mutation updateCart', { userId });

  const order = await services.orders.findOrInitCart({
    orderId,
    user: user!,
    countryCode: context.countryCode,
  });
  if (!order) throw new OrderNotFoundError({ orderId });
  if (!modules.orders.isCart(order)) throw new OrderWrongStatusError({ status: order.status });

  if (meta) {
    await modules.orders.updateContext(order._id, meta);
  }

  if (billingAddress) {
    await modules.orders.updateBillingAddress(order._id, billingAddress);
  }

  if (contact) {
    await modules.orders.updateContact(order._id, contact);
  }

  if (paymentProviderId) {
    await modules.orders.setPaymentProvider(order._id, paymentProviderId);
  }

  if (deliveryProviderId) {
    await modules.orders.setDeliveryProvider(order._id, deliveryProviderId);
  }

  // Recalculate, then return
  return services.orders.updateCalculation(order._id);
}
