import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api.js';
import { Address, Contact } from '@unchainedshop/types/common.js';
import { getOrderCart } from '../utils/getOrderCart.js';
import { OrderWrongStatusError } from '../../../errors.js';

interface UpdateCartParams {
  orderId?: string;
  billingAddress?: Address;
  contact?: Contact;
  paymentProviderId?: string;
  deliveryProviderId?: string;
  meta?: any;
}

export default async function updateCart(root: Root, params: UpdateCartParams, context: Context) {
  const { orderId, billingAddress, contact, paymentProviderId, deliveryProviderId, meta } = params;

  const { modules, userId, user } = context;

  log('mutation updateCart', { userId });

  let order = await getOrderCart({ orderId, user }, context);
  if (!modules.orders.isCart(order)) throw new OrderWrongStatusError({ status: order.status });

  if (meta) {
    order = await modules.orders.updateContext(order._id, meta, context);
  }

  if (billingAddress) {
    order = await modules.orders.updateBillingAddress(order._id, billingAddress, context);
  }

  if (contact) {
    order = await modules.orders.updateContact(order._id, contact, context);
  }

  if (paymentProviderId) {
    order = await modules.orders.setPaymentProvider(order._id, paymentProviderId, context);
  }

  if (deliveryProviderId) {
    order = await modules.orders.setDeliveryProvider(order._id, deliveryProviderId, context);
  }

  return order;
}
