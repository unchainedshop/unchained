import { Context } from '@unchainedshop/types/api';
import { User } from '@unchainedshop/types/user';
import {
  UserNotFoundError,
  OrderNotFoundError,
  OrderWrongStatusError,
} from '../../../errors';

export const getOrderCart = async (
  {
    orderId,
    user: userObject,
  }: {
    orderId?: string;
    user?: User;
  },
  { countryContext, modules, services, userId }: Context
) => {
  if (orderId) {
    const order = await modules.orders.findOrder({ orderId });
    if (!order) throw new OrderNotFoundError({ orderId });
    if (!modules.orders.isCart(order))
      throw new OrderWrongStatusError({ status: order.status });

    return order;
  }

  const user = userObject || (await modules.users.findUser({ userId }));
  if (!user) throw new UserNotFoundError({ userId });

  const cart = await modules.orders.cart({ countryContext }, user);
  if (cart) return cart;

  const currency = await await services.countries.resolveDefaultCurrencyCode({
    isoCode: countryContext,
  });

  return await modules.orders.create(
    {
      currency,
      countryCode: countryContext,
    },
    user
  );
};
