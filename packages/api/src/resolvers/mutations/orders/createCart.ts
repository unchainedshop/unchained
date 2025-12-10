import { log } from '@unchainedshop/logger';
import { OrderNumberAlreadyExistsError } from '../../../errors.ts';
import type { Context } from '../../../context.ts';

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
    user: user!,
    orderNumber,
    countryCode: context.countryCode,
    forceCartCreation: true,
  });
}
