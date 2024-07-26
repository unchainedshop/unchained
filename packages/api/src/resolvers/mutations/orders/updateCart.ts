import { log } from '@unchainedshop/logger';
import { Context } from '../../../types.js';
import { getOrderCart } from '../utils/getOrderCart.js';
import { OrderWrongStatusError } from '../../../errors.js';
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

  const { modules, userId, user } = context;

  log('mutation updateCart', { userId });

  let order = await getOrderCart({ orderId, user }, context);
  if (!modules.orders.isCart(order)) throw new OrderWrongStatusError({ status: order.status });

  if (meta) {
    order = await modules.orders.updateContext(order._id, meta);
  }

  if (billingAddress) {
    order = await modules.orders.updateBillingAddress(order._id, billingAddress);
  }

  if (contact) {
    order = await modules.orders.updateContact(order._id, contact);
  }

  if (paymentProviderId) {
    order = await modules.orders.setPaymentProvider(order._id, paymentProviderId, context);
  }

  if (deliveryProviderId) {
    order = await modules.orders.setDeliveryProvider(order._id, deliveryProviderId, context);
  }

  // Recalculate, then return
  return modules.orders.updateCalculation(order._id, context);
}
