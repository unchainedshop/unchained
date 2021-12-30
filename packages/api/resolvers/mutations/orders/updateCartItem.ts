import { log } from 'meteor/unchained:logger';
import { Context, Root } from '@unchainedshop/types/api';
import {
  OrderQuantityTooLowError,
  OrderItemNotFoundError,
  OrderWrongStatusError,
  InvalidIdError,
} from '../../../errors';
import { Configuration } from '@unchainedshop/types/common';

export default async function updateCartItem(
  root: Root,
  params: {
    itemId: string;
    quantity?: number;
    configuration?: Configuration;
  },
  { modules, userId }: Context
) {
  const { itemId, quantity = null, configuration = null } = params;

  log(
    `mutation updateCartItem ${itemId} ${quantity} ${JSON.stringify(
      configuration
    )}`,
    { userId }
  );

  if (!itemId) throw new InvalidIdError({ itemId });

  const item = await modules.orders.positions.findOrderPosition({ itemId });
  if (!item) throw new OrderItemNotFoundError({ itemId });

  const order = await modules.orders.findOrder({ orderId: item.orderId });
  if (!modules.orders.isCart(order)) {
    throw new OrderWrongStatusError({ status: order.status });
  }

  if (quantity !== null) {
    if (quantity < 1) throw new OrderQuantityTooLowError({ quantity });
    // FIXME: positionId is actually
    await modules.orders.positions.updatePosition(
      {
        orderId: item.orderId,
        positionId: itemId,
      },
      { quantity },
      userId
    );
  }

  if (configuration !== null) {
    await modules.orders.positions.updatePosition(
      {
        orderId: item.orderId,
        positionId: itemId,
      },
      { configuration },
      userId
    );
  }

  return await modules.orders.positions.findOrderPosition({ itemId });
}
