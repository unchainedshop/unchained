import { log } from '@unchainedshop/logger';
import { Root, Context } from '@unchainedshop/types/api';
import { OrderNotFoundError, InvalidIdError } from '../../../errors';

export default async function setOrderPaymentProvider(
  root: Root,
  params: { orderId: string; paymentProviderId: string },
  context: Context,
) {
  const { modules, userId } = context;
  const { orderId, paymentProviderId } = params;

  log(`mutation setOrderPaymentProvider ${paymentProviderId}`, {
    orderId,
    userId,
  });

  if (!orderId) throw new InvalidIdError({ orderId });
  if (!paymentProviderId) throw new InvalidIdError({ paymentProviderId });

  const order = await modules.orders.findOrder({ orderId });
  if (!order) throw new OrderNotFoundError({ orderId });

  return modules.orders.setPaymentProvider(orderId, paymentProviderId, context);
}
