import { log } from '@unchainedshop/logger';
import type { Context } from '../../../context.ts';
import { ProductNotFoundError, InvalidIdError } from '../../../errors.ts';

export default async function requestQuotation(
  root: never,
  params: { productId: string; configuration: { key: string; value: string }[] },
  context: Context,
) {
  const { countryCode, currencyCode, modules, services, userId } = context;
  const { productId, configuration } = params;

  log(`mutation requestQuotation ${productId} ${configuration ? JSON.stringify(configuration) : ''}`, {
    userId,
  });

  if (!productId) throw new InvalidIdError({ productId });

  if (!(await modules.products.productExists({ productId })))
    throw new ProductNotFoundError({ productId });

  const newQuotation = await modules.quotations.create({
    userId: userId!,
    productId,
    countryCode,
    currencyCode,
    configuration,
  });

  return services.quotations.processQuotation(newQuotation, {});
}
