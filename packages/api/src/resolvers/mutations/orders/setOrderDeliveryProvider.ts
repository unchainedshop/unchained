import { log } from '@unchainedshop/logger';
import { Root, Context } from '@unchainedshop/types/api.js';
import { OrderNotFoundError, InvalidIdError } from '../../../errors.js';

export default async function setOrderDeliveryProvider(
  root: Root,
  params: { orderId: string; deliveryProviderId: string },
  context: Context,
) {
  const { modules, userId } = context;
  const { orderId, deliveryProviderId } = params;

  log(`mutation setOrderDeliveryProvider ${deliveryProviderId}`, {
    orderId,
    userId,
  });

  if (!orderId) throw new InvalidIdError({ orderId });
  if (!deliveryProviderId) throw new InvalidIdError({ deliveryProviderId });

  if (!(await modules.orders.orderExists({ orderId }))) throw new OrderNotFoundError({ orderId });

  await modules.orders.setDeliveryProvider(orderId, deliveryProviderId, context);
  return modules.orders.updateCalculation(orderId, context);
}
