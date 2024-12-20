import { log } from '@unchainedshop/logger';
import { Context } from '../../../context.js';
import { OrderNotFoundError, OrderWrongStatusError } from '../../../errors.js';
import { Address, Contact } from '@unchainedshop/mongodb';

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

  let order = await services.orders.cart({ orderId, user });
  if (!order) throw new OrderNotFoundError({ orderId });
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
    order = await modules.orders.setPaymentProvider(order._id, paymentProviderId);
  }

  if (deliveryProviderId) {
    order = await modules.orders.setDeliveryProvider(order._id, deliveryProviderId);
  }

  // Recalculate, then return
  return services.orders.updateCalculation(order._id);
}
