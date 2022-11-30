import { log } from '@unchainedshop/logger';
import { Root, Context } from '@unchainedshop/types/api';
import { OrderNumberAlreadyExistsError } from '../../../errors';

export default async function createCart(
  root: Root,
  { orderNumber }: { orderNumber: string },
  context: Context,
) {
  const { modules, services, userId, user } = context;
  log('mutation createCart', { userId });

  const order = await modules.orders.findOrder({ orderNumber });
  if (order) throw new OrderNumberAlreadyExistsError({ orderNumber });

  return services.orders.createUserCart(
    { user, orderNumber, countryCode: context.countryContext },
    context,
  );
}
