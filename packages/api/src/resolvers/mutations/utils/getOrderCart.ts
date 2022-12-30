import { Context } from '@unchainedshop/types/api.js';
import { User } from '@unchainedshop/types/user.js';
import { OrderNotFoundError, OrderWrongStatusError } from '../../../errors.js';

export const getOrderCart = async (params: { orderId?: string; user: User }, context: Context) => {
  const { countryContext, modules, services } = context;
  const { orderId, user } = params;

  if (orderId) {
    const order = await modules.orders.findOrder({ orderId });
    if (!order) throw new OrderNotFoundError({ orderId });

    if (!modules.orders.isCart(order)) throw new OrderWrongStatusError({ status: order.status });
    return order;
  }

  const cart = await modules.orders.cart({ countryContext }, user);
  if (cart) return cart;

  return services.orders.createUserCart({ user, countryCode: context.countryContext }, context);
};
