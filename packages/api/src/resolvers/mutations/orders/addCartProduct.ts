import { log } from '@unchainedshop/logger';
import type { Context } from '../../../context.ts';
import { InvalidIdError, OrderWrongStatusError, OrderNotFoundError } from '../../../errors.ts';
import { rethrowCartProductError } from './mapOrderServiceError.ts';

export default async function addCartProduct(
  root: never,
  { orderId, productId: originalProductId, quantity, configuration },
  context: Context,
) {
  const { modules, services, userId, user } = context;

  log(
    `mutation addCartProduct ${originalProductId} ${quantity} ${
      configuration ? JSON.stringify(configuration) : ''
    }`,
    { userId, orderId },
  );

  if (!originalProductId) throw new InvalidIdError({ productId: originalProductId });

  const order = await services.orders.findOrInitCart({
    orderId,
    user: user!,
    countryCode: context.countryCode,
  });
  if (!order) throw new OrderNotFoundError({ orderId });

  if (!modules.orders.isCart(order)) throw new OrderWrongStatusError({ status: order.status });

  const [orderPosition] = await services.orders
    .addMultipleCartProducts(
      { order, items: [{ productId: originalProductId, quantity, configuration }] },
      context,
    )
    .catch(rethrowCartProductError);

  await services.orders.updateCalculation(order._id);
  return modules.orders.positions.findOrderPosition({ itemId: orderPosition._id });
}
