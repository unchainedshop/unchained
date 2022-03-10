import { Context } from '@unchainedshop/types/api';
import { User } from '@unchainedshop/types/user';
import { UserNotFoundError, OrderNotFoundError, OrderWrongStatusError } from '../../../errors';

export const getOrderCart = async (params: { orderId?: string; user?: User }, context: Context) => {
  const { countryContext, modules, services, userId } = context;
  const { orderId } = params;

  if (orderId) {
    const order = await modules.orders.findOrder({ orderId });
    if (!order) throw new OrderNotFoundError({ orderId });

    if (!modules.orders.isCart(order)) throw new OrderWrongStatusError({ status: order.status });
    return order;
  }

  const user = params.user || (await modules.users.findUserById(userId));
  if (!user) throw new UserNotFoundError({ userId });

  const cart = await modules.orders.cart({ countryContext }, user);
  if (cart) return cart;

  return services.orders.createUserCart({ user }, context);
};
