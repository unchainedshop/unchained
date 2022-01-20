import { log } from 'meteor/unchained:logger';
import { Context, Root } from '@unchainedshop/types/api';
import {
  ProductNotFoundError,
  OrderQuantityTooLowError,
} from '../../../errors';
import { getOrderCart } from '../utils/getOrderCart';
import { Configuration } from '@unchainedshop/types/common';

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
  context: Context
) {
  const { modules, userId } = context;
  const { orderId, items } = params;

  /* verify existence of products */
  const itemsWithProducts = await Promise.all(
    items.map(async ({ productId, ...item }) => {
      const product = await modules.products.findProduct({ productId });
      if (!product) throw new ProductNotFoundError({ productId });

      return {
        ...item,
        product,
      };
    })
  );

  const order = await getOrderCart({ orderId }, context);

  // Reduce is used to wait for each product to be added before processing the next (sequential processing)
  return await itemsWithProducts.reduce(
    async (positionsPromise, { product, quantity, configuration }) => {
      const positions = await positionsPromise;
      if (quantity < 1)
        throw new OrderQuantityTooLowError({
          quantity,
          productId: product._id,
        });

      log(
        `mutation addCartProduct ${product._id} ${quantity} ${
          configuration ? JSON.stringify(configuration) : ''
        }`,
        { userId, orderId }
      );

      const position = await modules.orders.positions.addProductItem(
        {
          quantity,
          configuration,
        },
        { order, product },
        context
      );
      
      positions.push(position);

      return positions;
    },
    Promise.resolve([])
  );
}
