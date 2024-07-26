import { log } from '@unchainedshop/logger';
import { Context } from '../../../types.js';
import {
  OrderQuantityTooLowError,
  OrderItemNotFoundError,
  OrderWrongStatusError,
  ProductNotFoundError,
  InvalidIdError,
} from '../../../errors.js';

export default async function updateCartItem(
  root: never,
  params: {
    itemId: string;
    quantity?: number;
    configuration?: Array<{ key: string; value: string }>;
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

  const productId = item.originalProductId || item.productId;
  const product = await modules.products.findProduct({
    productId,
  });
  if (!product) throw new ProductNotFoundError({ productId });

  if (quantity !== null && quantity < 1) throw new OrderQuantityTooLowError({ quantity });

  const updatedOrderPosition = await modules.orders.positions.updateProductItem(
    { quantity, configuration },
    {
      order,
      product,
      orderPosition: item,
    },
    context,
  );
  await modules.orders.updateCalculation(order._id, context);
  return updatedOrderPosition;
}
