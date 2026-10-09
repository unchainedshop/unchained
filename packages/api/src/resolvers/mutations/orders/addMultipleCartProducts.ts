import { log } from '@unchainedshop/logger';
import type { Context } from '../../../context.ts';
import { OrderNotFoundError } from '../../../errors.ts';
import { rethrowCartProductServiceError } from './mapOrderServiceError.ts';

export default async function addMultipleCartProducts(
  root: never,
  params: {
    orderId: string;
    items: {
      productId: string;
      quantity: number;
      configuration?: { key: string; value: string }[];
    }[];
  },
  context: Context,
) {
  const { services, userId, user, locale, countryCode } = context;
  const { orderId, items } = params;

  log(`mutation addMultipleCartProducts ${JSON.stringify(items)}`, {
    userId,
    orderId,
  });

  const order = await services.orders.findOrInitCart({
    orderId,
    user: user!,
    countryCode,
  });
  if (!order) throw new OrderNotFoundError({ orderId });

  try {
    return await services.orders.addMultipleCartProducts({
      orderId: order._id,
      items,
      context: { localeContext: locale, userId, countryCode },
    });
  } catch (error) {
    rethrowCartProductServiceError(error);
  }
}
