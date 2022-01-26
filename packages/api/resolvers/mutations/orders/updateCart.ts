import { log } from 'meteor/unchained:logger';
import { Context, Root } from '@unchainedshop/types/api';
import { Address, Contact } from '@unchainedshop/types/common';
import { getOrderCart } from '../utils/getOrderCart';
import { UserNotFoundError } from '../../../errors';

interface UpdateCartParams {
  orderId?: string;
  billingAddress?: Address;
  contact?: Contact;
  paymentProviderId?: string;
  deliveryProviderId?: string;
  meta?: any;
}

export default async function updateCart(
  root: Root,
  params: UpdateCartParams,
  context: Context
) {
  const {
    orderId,
    billingAddress,
    contact,
    paymentProviderId,
    deliveryProviderId,
    meta,
  } = params;

  const { modules, userId } = context;

  log('mutation updateCart', { userId });

  const user = await modules.users.findUser({ userId });
  if (!user) throw UserNotFoundError({ userId });

  let order = await getOrderCart({ orderId, user }, context);

  if (meta) {
    order = await modules.orders.updateContext(order._id, meta, context);
  }

  if (billingAddress) {
    order = await modules.orders.updateBillingAddress(
      order._id,
      billingAddress,
      context
    );
  }

  if (contact) {
    order = await modules.orders.updateContact(order._id, contact, context);
  }

  if (paymentProviderId) {
    order = await modules.orders.setPaymentProvider(
      order._id,
      paymentProviderId,
      context
    );
  }

  if (deliveryProviderId) {
    order = await modules.orders.setDeliveryProvider(
      order._id,
      deliveryProviderId,
      context
    );
  }

  return order;
}
