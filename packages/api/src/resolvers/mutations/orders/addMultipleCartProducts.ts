import { log } from '@unchainedshop/logger';
import type { Context } from '../../../context.ts';
import { ProductNotFoundError, OrderQuantityTooLowError } from '../../../errors.ts';
import loadCart from './loadCart.ts';

export default async function addMultipleCartProducts(
  root: never,
  params: {
    orderId: string;
    items: {
      productId: string;
      quantity: number;
      configuration?: { key: string; value: string }[];
    }[];
  },
  context: Context,
) {
  const { modules, services, userId } = context;
  const { orderId, items } = params;

  log(`mutation addMultipleCartProducts ${JSON.stringify(items)}`, { userId, orderId });

  for (const { productId, quantity } of items) {
    const product = await modules.products.findProduct({ productId });
    if (!product) throw new ProductNotFoundError({ productId });
    if (quantity < 1) throw new OrderQuantityTooLowError({ quantity, productId });
  }

  const order = await loadCart(context, orderId);

  await services.orders.addMultipleCartProducts({ order, items }, context);

  return services.orders.updateCalculation(order._id);
}
