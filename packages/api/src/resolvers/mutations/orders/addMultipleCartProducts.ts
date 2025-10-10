import { log } from '@unchainedshop/logger';
import { Context } from '../../../context.js';
import {
  ProductNotFoundError,
  OrderQuantityTooLowError,
  OrderWrongStatusError,
  OrderNotFoundError,
} from '../../../errors.js';
import { ordersSettings } from '@unchainedshop/core-orders';

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
  const { modules, services, userId, user } = context;
  const { orderId, items } = params;

  log(`mutation addMultipleCartProducts ${JSON.stringify(items)}`, {
    userId,
    orderId,
  });

  /* verify existence of products */
  const itemsWithProducts = await Promise.all(
    items.map(async ({ productId, ...item }) => {
      const originalProduct = await modules.products.findProduct({ productId });
      if (!originalProduct) throw new ProductNotFoundError({ productId });

      return {
        ...item,
        originalProduct,
      };
    }),
  );

  const order = await services.orders.findOrInitCart({
    orderId,
    user: user!,
    countryCode: context.countryCode,
  });
  if (!order) throw new OrderNotFoundError({ orderId });
  if (!modules.orders.isCart(order)) throw new OrderWrongStatusError({ status: order.status });

  for (const { originalProduct, quantity, configuration } of itemsWithProducts) {
    if (quantity < 1)
      throw new OrderQuantityTooLowError({
        quantity,
        productId: originalProduct._id,
      });

    const product = await modules.products.resolveOrderableProduct(originalProduct, {
      configuration,
    });

    await ordersSettings.validateOrderPosition(
      {
        order,
        product,
        configuration,
        quantityDiff: quantity,
      },
      context,
    );

    await modules.orders.positions.addProductItem({
      quantity,
      configuration,
      originalProductId: originalProduct._id,
      productId: product._id,
      orderId: order._id,
    });
  }

  return services.orders.updateCalculation(order._id);
}
