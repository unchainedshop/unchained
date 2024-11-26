import { log } from '@unchainedshop/logger';
import { OrderNotFoundError, InvalidIdError } from '../../../errors.js';
import { Context } from '../../../context.js';

export default async function setOrderDeliveryProvider(
  root: never,
  params: { orderId: string; deliveryProviderId: string },
  context: Context,
) {
  const { modules, services, userId } = context;
  const { orderId, deliveryProviderId } = params;

  log(`mutation setOrderDeliveryProvider ${deliveryProviderId}`, {
    orderId,
    userId,
  });

  if (!orderId) throw new InvalidIdError({ orderId });
  if (!deliveryProviderId) throw new InvalidIdError({ deliveryProviderId });

  if (!(await modules.orders.orderExists({ orderId }))) throw new OrderNotFoundError({ orderId });

  await modules.orders.setDeliveryProvider(orderId, deliveryProviderId, context);
  return services.orders.updateCalculation(orderId, context);
}
