import { log } from '@unchainedshop/logger';
import type { Context } from '../../../context.ts';
import {
  ProductNotFoundError,
  OrderQuantityTooLowError,
  OrderWrongStatusError,
  OrderNotFoundError,
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
  const { modules, services, userId, user, locale, countryCode } = context;
  const { orderId, items } = params;

  log(`mutation addMultipleCartProducts ${JSON.stringify(items)}`, {
    userId,
    orderId,
  });

  // Validate all products exist first
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

  try {
    await services.orders.addMultipleCartProducts({
      orderId: order._id,
      items,
      context: { localeContext: locale, userId, countryCode },
    });
  } catch (error) {
    if (error.message?.startsWith('Product not found:')) {
      const productId = error.message.split(': ')[1];
      throw new ProductNotFoundError({ productId });
    }
    if (error.message?.startsWith('Invalid quantity')) {
      const productId = error.message.split(': ')[1];
      throw new OrderQuantityTooLowError({ quantity: 0, productId });
    }
    throw error;
  }

  return services.orders.updateCalculation(order._id);
}
