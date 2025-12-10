import type { Context } from '../../../../context.ts';
import { getNormalizedOrderDetails } from '../../../utils/getNormalizedOrderDetails.ts';
import type { Params } from '../schemas.ts';

export default async function getOrder(context: Context, params: Params<'GET'>) {
  const { orderId, orderNumber } = params;

  const order = await getNormalizedOrderDetails({ orderId, orderNumber }, context);

  return {
    order,
  };
}
