import { Context } from '../../../../context.js';
import { getNormalizedOrderDetails } from '../../../utils/getNormalizedOrderDetails.js';
import { Params } from '../schemas.js';

export default async function getOrder(context: Context, params: Params<'GET'>) {
  const { orderId, orderNumber } = params;

  const order = await getNormalizedOrderDetails({ orderId, orderNumber }, context);

  return {
    order,
  };
}
