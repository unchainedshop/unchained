import { Context } from '@unchainedshop/types/api.js';
import { User } from '@unchainedshop/types/user.js';
import { OrderNotFoundError } from '../../../errors.js';

export const getOrderCart = async (params: { orderId?: string; user: User }, context: Context) => {
  const { modules, services } = context;
  const { orderId, user } = params;

  if (orderId) {
    const order = await modules.orders.findOrder({ orderId });
    if (!order) throw new OrderNotFoundError({ orderId });
    return order;
  }

  return services.orders.nextUserCart(
    { user, countryCode: context.countryContext, forceCartCreation: true },
    context,
  );
};
