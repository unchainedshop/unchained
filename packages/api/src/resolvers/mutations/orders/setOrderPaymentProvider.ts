import { log } from '@unchainedshop/logger';
import { OrderNotFoundError, InvalidIdError } from '../../../errors.ts';
import type { Context } from '../../../context.ts';

export default async function setOrderPaymentProvider(
  root: never,
  params: { orderId: string; paymentProviderId: string },
  context: Context,
) {
  const { modules, services, userId } = context;
  const { orderId, paymentProviderId } = params;

  log(`mutation setOrderPaymentProvider ${paymentProviderId}`, {
    orderId,
    userId,
  });

  if (!orderId) throw new InvalidIdError({ orderId });
  if (!paymentProviderId) throw new InvalidIdError({ paymentProviderId });

  const order = await modules.orders.findOrder({ orderId });
  if (!order) throw new OrderNotFoundError({ orderId });

  await modules.orders.setPaymentProvider(orderId, paymentProviderId);
  return services.orders.updateCalculation(orderId);
}
