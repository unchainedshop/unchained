import { log } from '@unchainedshop/logger';
import type { Context } from '../../../context.ts';
import { InvalidIdError, OrderNotFoundError } from '../../../errors.ts';
import { rethrowCartProductServiceError } from './mapOrderServiceError.ts';

export default async function addCartProduct(
  root: never,
  { orderId, productId: originalProductId, quantity, configuration },
  context: Context,
) {
  const { services, userId, user, locale, countryCode } = context;

  log(
    `mutation addCartProduct ${originalProductId} ${quantity} ${
      configuration ? JSON.stringify(configuration) : ''
    }`,
    { userId, orderId },
  );

  if (!originalProductId) throw new InvalidIdError({ productId: originalProductId });

  const order = await services.orders.findOrInitCart({
    orderId,
    user: user!,
    countryCode,
  });
  if (!order) throw new OrderNotFoundError({ orderId });

  try {
    return await services.orders.addCartProduct({
      orderId: order._id,
      item: { productId: originalProductId, quantity, configuration },
      context: { localeContext: locale, userId, countryCode },
    });
  } catch (error) {
    rethrowCartProductServiceError(error);
  }
}
