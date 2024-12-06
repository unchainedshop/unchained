import { log } from '@unchainedshop/logger';
import { Context } from '../../../context.js';
import {
  ProductNotFoundError,
  OrderQuantityTooLowError,
  OrderWrongStatusError,
} from '../../../errors.js';
import { getOrderCart } from '../utils/getOrderCart.js';
import { ordersSettings } from '@unchainedshop/core-orders';

export default async function addMultipleCartProducts(
  root: never,
  params: {
    orderId: string;
    items: Array<{
      productId: string;
      quantity: number;
      configuration?: Array<{ key: string; value: string }>;
    }>;
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

  const order = await getOrderCart({ orderId, user }, context);
  if (!modules.orders.isCart(order)) throw new OrderWrongStatusError({ status: order.status });

  // Reduce is used to wait for each product to be added before processing the next (sequential processing)
  await itemsWithProducts.reduce(
    async (positionsPromise, { originalProduct, quantity, configuration }) => {
      const positions = await positionsPromise;
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

      const position = await modules.orders.positions.addProductItem({
        quantity,
        configuration,
        originalProductId: originalProduct._id,
        productId: product._id,
        orderId,
      });
      positions.push(position);
      return positions;
    },
    Promise.resolve([]),
  );

  return services.orders.updateCalculation(order._id, context);
}
