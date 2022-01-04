import { log } from 'meteor/unchained:logger';
import { getOrderCart } from './getOrderCart';
import { Context, Root } from '@unchainedshop/types/api';
import {
  ProductNotFoundError,
  OrderQuantityTooLowError,
  InvalidIdError,
  UserNotFoundError,
} from '../../../errors';

export default async function addCartDiscount(
  root: Root,
  { orderId, code }: { orderId?: string; code: string },
  context: Context
) {
  const { modules, userId } = context;

  log(`mutation addCartDiscount ${code} ${orderId}`, { userId, orderId });

  const user = await modules.users.findUser({ userId });
  if (!user) throw new UserNotFoundError({ userId });

  const cart = await getOrderCart({ orderId, user }, context);

  return await modules.orders.discounts.create(
    { orderId: cart._id as string, code },
    userId
  );
}
