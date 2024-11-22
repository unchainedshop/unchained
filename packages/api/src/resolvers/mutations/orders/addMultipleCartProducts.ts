import { log } from '@unchainedshop/logger';
import { Context } from '../../../context.js';
import {
  ProductNotFoundError,
  OrderQuantityTooLowError,
  OrderWrongStatusError,
} from '../../../errors.js';
import { getOrderCart } from '../utils/getOrderCart.js';

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
  const { modules, userId, user } = context;
  const { orderId, items } = params;

  log(`mutation addMultipleCartProducts ${JSON.stringify(items)}`, {
    userId,
    orderId,
  });

  /* verify existence of products */
  const itemsWithProducts = await Promise.all(
    items.map(async ({ productId, ...item }) => {
      const product = await modules.products.findProduct({ productId });
      if (!product) throw new ProductNotFoundError({ productId });

      return {
        ...item,
        product,
      };
    }),
  );

  const order = await getOrderCart({ orderId, user }, context);
  if (!modules.orders.isCart(order)) throw new OrderWrongStatusError({ status: order.status });

  // Reduce is used to wait for each product to be added before processing the next (sequential processing)
  await itemsWithProducts.reduce(async (positionsPromise, { product, quantity, configuration }) => {
    const positions = await positionsPromise;
    if (quantity < 1)
      throw new OrderQuantityTooLowError({
        quantity,
        productId: product._id,
      });

    const position = await modules.orders.positions.addProductItem(
      {
        quantity,
        configuration,
      },
      { order, product },
      context,
    );
    positions.push(position);
    return positions;
  }, Promise.resolve([]));

  return modules.orders.updateCalculation(order._id, context);
}
