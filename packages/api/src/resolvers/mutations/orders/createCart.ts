import { log } from '@unchainedshop/logger';
import { OrderNumberAlreadyExistsError } from '../../../errors.js';
import { Context } from '../../../context.js';

export default async function createCart(
  root: never,
  { orderNumber }: { orderNumber: string },
  context: Context,
) {
  const { modules, services, userId, user } = context;
  log('mutation createCart', { userId });

  const order = await modules.orders.findOrder({ orderNumber });
  if (order) throw new OrderNumberAlreadyExistsError({ orderNumber });

  return services.orders.nextUserCart({
    user,
    orderNumber,
    countryCode: context.countryContext,
    forceCartCreation: true,
  });
}
