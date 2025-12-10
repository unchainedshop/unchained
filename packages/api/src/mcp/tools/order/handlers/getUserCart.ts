import type { Context } from '../../../../context.ts';
import { getNormalizedOrderDetails } from '../../../utils/getNormalizedOrderDetails.ts';
import type { Params } from '../schemas.ts';

export default async function getUserCart(context: Context, params: Params<'GET_CART'>) {
  const { modules, countryCode } = context;

  const order = await modules.orders.cart({
    countryCode,
    orderNumber: params?.orderNumber,
    userId: params?.userId,
  });

  return { order: await getNormalizedOrderDetails({ orderId: order?._id }, context) };
}
