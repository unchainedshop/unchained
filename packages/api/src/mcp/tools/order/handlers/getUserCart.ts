import { Context } from '../../../../context.js';
import { getNormalizedOrderDetails } from '../../../utils/getNormalizedOrderDetails.js';
import { Params } from '../schemas.js';

export default async function getUserCart(context: Context, params: Params<'GET_CART'>) {
  const { modules, countryCode } = context;

  const order = await modules.orders.cart({
    countryCode,
    orderNumber: params?.orderNumber,
    userId: params?.userId,
  });

  return { order: await getNormalizedOrderDetails({ orderId: order?._id }, context) };
}
