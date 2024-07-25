import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api.js';
import { Configuration } from '@unchainedshop/types/common.js';
import {
  ProductNotFoundError,
  OrderQuantityTooLowError,
  OrderWrongStatusError,
} from '../../../errors.js';
import { getOrderCart } from '../utils/getOrderCart.js';

export default async function addMultipleCartProducts(
  root: Root,
  params: {
    orderId: string;
    items: Array<{
      productId: string;
      quantity: number;
      configuration?: Configuration;
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
  const updatedOrderPositions = await itemsWithProducts.reduce(
    async (positionsPromise, { product, quantity, configuration }) => {
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
    },
    Promise.resolve([]),
  );

  await modules.orders.updateCalculation(order._id, context);
  return updatedOrderPositions;
}
