import { log } from '@unchainedshop/logger';
import { Root, Context } from '@unchainedshop/types/api.js';
import { OrderNotFoundError, InvalidIdError } from '../../../errors.js';

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

  await modules.orders.setPaymentProvider(orderId, paymentProviderId, context);
  return modules.orders.updateCalculation(orderId, context);
}
