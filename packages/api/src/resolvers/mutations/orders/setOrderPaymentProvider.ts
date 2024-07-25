import { log } from '@unchainedshop/logger';
import { OrderNotFoundError, InvalidIdError } from '../../../errors.js';
import { Context } from '../../../types.js';

export default async function setOrderPaymentProvider(
  root: never,
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
