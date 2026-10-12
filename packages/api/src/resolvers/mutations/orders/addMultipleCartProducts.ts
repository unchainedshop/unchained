import { log } from '@unchainedshop/logger';
import type { Context } from '../../../context.ts';
import {
  ProductNotFoundError,
  OrderQuantityTooLowError,
  OrderWrongStatusError,
  OrderNotFoundError,
  rethrowCartProductError,
} from '../../../errors.ts';

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
  const { modules, services, userId, user, countryCode } = context;
  const { orderId, items } = params;

  log(`mutation addMultipleCartProducts ${JSON.stringify(items)}`, {
    userId,
    orderId,
  });

  for (const { productId, quantity } of items) {
    const product = await modules.products.findProduct({ productId });
    if (!product) throw new ProductNotFoundError({ productId });
    if (quantity < 1) throw new OrderQuantityTooLowError({ quantity, productId });
  }

  const order = await services.orders.findOrInitCart({
    orderId,
    user: user!,
    countryCode,
  });
  if (!order) throw new OrderNotFoundError({ orderId });
  if (!modules.orders.isCart(order)) throw new OrderWrongStatusError({ status: order.status });

  await services.orders
    .addMultipleCartProducts({ order, items }, context)
    .catch(rethrowCartProductError);

  return services.orders.updateCalculation(order._id);
}
