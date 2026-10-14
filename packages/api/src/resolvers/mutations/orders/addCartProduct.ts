import { log } from '@unchainedshop/logger';
import type { Context } from '../../../context.ts';
import { ProductNotFoundError, OrderQuantityTooLowError, InvalidIdError } from '../../../errors.ts';
import { lockCart } from '../../loadCart.ts';

export default async function addCartProduct(
  root: never,
  { orderId, productId: originalProductId, quantity, configuration },
  context: Context,
) {
  const { modules, services, userId } = context;

  log(
    `mutation addCartProduct ${originalProductId} ${quantity} ${
      configuration ? JSON.stringify(configuration) : ''
    }`,
    { userId, orderId },
  );

  if (!originalProductId) throw new InvalidIdError({ productId: originalProductId });
  if (quantity < 1) throw new OrderQuantityTooLowError({ quantity });

  const originalProduct = await modules.products.findProduct({ productId: originalProductId });
  if (!originalProduct) throw new ProductNotFoundError({ productId: originalProductId });

  await using order = await lockCart(context, orderId);

  const [orderPosition] = await services.orders.addMultipleCartProducts(
    { order, items: [{ productId: originalProductId, quantity, configuration }] },
    context,
  );

  await services.orders.updateCalculation(order._id);
  return modules.orders.positions.findOrderPosition({ itemId: orderPosition._id });
}
