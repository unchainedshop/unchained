import { Context, Root } from '@unchainedshop/types/api';
import { log } from 'meteor/unchained:logger';
import { UserNotFoundError } from '../../../errors';
import { getOrderCart } from '../utils/getOrderCart';

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

  return await modules.orders.discounts.createManualOrderDiscount(
    { orderId: cart._id, code },
    context
  );
}
