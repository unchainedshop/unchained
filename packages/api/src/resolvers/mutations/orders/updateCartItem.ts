import { log } from 'meteor/unchained:logger';
import { Context, Root } from '@unchainedshop/types/api';
import { Configuration } from '@unchainedshop/types/common';
import {
  OrderQuantityTooLowError,
  OrderItemNotFoundError,
  OrderWrongStatusError,
  ProductNotFoundError,
  InvalidIdError,
} from '../../../errors';

export default async function updateCartItem(
  root: Root,
  params: {
    itemId: string;
    quantity?: number;
    configuration?: Configuration;
  },
  context: Context,
) {
  const { modules, userId } = context;
  const { itemId, configuration = null, quantity = null } = params;

  log(`mutation updateCartItem ${itemId} ${quantity} ${JSON.stringify(configuration)}`, { userId });

  if (!itemId) throw new InvalidIdError({ itemId });

  const item = await modules.orders.positions.findOrderPosition({ itemId });
  if (!item) throw new OrderItemNotFoundError({ itemId });

  const order = await modules.orders.findOrder({ orderId: item.orderId });
  if (!modules.orders.isCart(order)) {
    throw new OrderWrongStatusError({ status: order.status });
  }

  const productId = item.originalProductId || item.productId;
  const product = await modules.products.findProduct({
    productId,
  });
  if (!product) throw new ProductNotFoundError({ productId });

  if (quantity !== null && quantity < 1) throw new OrderQuantityTooLowError({ quantity });

  return modules.orders.positions.updateProductItem(
    { quantity, configuration },
    {
      order,
      product,
      orderPosition: item,
    },
    context,
  );
}
