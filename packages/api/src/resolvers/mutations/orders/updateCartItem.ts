import { log } from '@unchainedshop/logger';
import type { Context } from '../../../context.ts';
import { InvalidIdError } from '../../../errors.ts';
import { rethrowCartProductServiceError } from './mapOrderServiceError.ts';

export default async function updateCartItem(
  root: never,
  params: {
    itemId: string;
    quantity?: number;
    configuration?: { key: string; value: string }[];
  },
  context: Context,
) {
  const { services, userId, locale, countryCode } = context;
  const { itemId, configuration, quantity } = params;

  log(`mutation updateCartItem ${itemId} ${quantity} ${JSON.stringify(configuration)}`, { userId });

  if (!itemId) throw new InvalidIdError({ itemId });

  try {
    return await services.orders.updateCartProduct({
      itemId,
      quantity,
      configuration,
      context: { localeContext: locale, userId, countryCode },
    });
  } catch (error) {
    rethrowCartProductServiceError(error);
  }
}
