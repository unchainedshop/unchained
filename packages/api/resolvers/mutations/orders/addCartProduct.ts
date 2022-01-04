import { log } from 'meteor/unchained:logger';
import {
  ProductNotFoundError,
  OrderQuantityTooLowError,
  InvalidIdError,
  UserNotFoundError,
} from '../../../errors';
import { getOrderCart } from './getOrderCart';
import { Context, Root } from '@unchainedshop/types/api';

export default async function addCartProduct(
  root: Root,
  { orderId, productId, quantity, configuration },
  context: Context
) {
  const { modules, userId } = context;

  log(
    `mutation addCartProduct ${productId} ${quantity} ${
      configuration ? JSON.stringify(configuration) : ''
    }`,
    { userId, orderId }
  );

  if (!productId) throw new InvalidIdError({ productId });
  if (quantity < 1) throw new OrderQuantityTooLowError({ quantity });

  const product = await modules.products.findProduct({ productId });
  if (!product) throw new ProductNotFoundError({ productId });
  const user = await modules.users.findUser({ userId });
  if (!user) throw new UserNotFoundError({ userId });

  const order = await getOrderCart({ orderId, user }, context);

  return await modules.orders.positions.create(
    {
      quantity,
      configuration,
    },
    { order, product },
    context
  );
}
