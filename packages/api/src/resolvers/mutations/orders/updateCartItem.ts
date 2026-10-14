import { log } from '@unchainedshop/logger';
import type { Context } from '../../../context.ts';
import {
  OrderQuantityTooLowError,
  OrderItemNotFoundError,
  ProductNotFoundError,
  InvalidIdError,
  QuotationNotFoundError,
  QuotationItemConfigurationError,
  mapServiceError,
} from '../../../errors.ts';
import { lockCart } from '../../loadCart.ts';

export default async function updateCartItem(
  root: never,
  params: {
    itemId: string;
    quantity?: number;
    configuration?: { key: string; value: string }[];
  },
  context: Context,
) {
  const { modules, services, userId } = context;
  const { itemId, configuration, quantity } = params;

  log(`mutation updateCartItem ${itemId} ${quantity} ${JSON.stringify(configuration)}`, { userId });

  if (!itemId) throw new InvalidIdError({ itemId });

  const position = await modules.orders.positions.findOrderPosition({ itemId });
  if (!position) throw new OrderItemNotFoundError({ itemId });

  await using order = await lockCart(context, position.orderId);
  const item = await modules.orders.positions.findOrderPosition({ itemId });
  if (item?.orderId !== order._id) throw new OrderItemNotFoundError({ itemId });

  if (quantity != null && quantity < 1) throw new OrderQuantityTooLowError({ quantity });

  try {
    await services.orders.updateCartItem({ order, item, quantity, configuration }, context);
  } catch (error) {
    throw mapServiceError(error, {
      ProductNotFoundError,
      QuotationNotFoundError,
      QuotationItemConfigurationError,
    });
  }

  await services.orders.updateCalculation(order._id);
  return modules.orders.positions.findOrderPosition({ itemId: item._id });
}
