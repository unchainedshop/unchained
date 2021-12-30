import { log } from 'meteor/unchained:logger';
import { Context, Root } from '@unchainedshop/types/api';
import {
  ProductNotFoundError,
  OrderQuantityTooLowError,
} from '../../../errors';
import { getOrderCart } from './getOrderCart';
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

  const cart = await getOrderCart({ orderId }, context);

  return await Promise.all(
    itemsWithProducts.map(async ({ product, quantity, configuration }) => {
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

      return await modules.orders.positions.create({
        orderId: cart._id as string,
        product,
        quantity,
        configuration,
      });
    })
  );
}
