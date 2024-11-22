import { log } from '@unchainedshop/logger';
import { Context } from '../../../context.js';
import { ProductNotFoundError, InvalidIdError } from '../../../errors.js';

export default async function requestQuotation(
  root: never,
  params: { productId: string; configuration: Array<{ key: string; value: string }> },
  context: Context,
) {
  const { countryContext, modules, userId } = context;
  const { productId, configuration } = params;

  log(`mutation requestQuotation ${productId} ${configuration ? JSON.stringify(configuration) : ''}`, {
    userId,
  });

  if (!productId) throw new InvalidIdError({ productId });

  if (!(await modules.products.productExists({ productId })))
    throw new ProductNotFoundError({ productId });

  return modules.quotations.create(
    {
      userId,
      productId,
      countryCode: countryContext,
      configuration,
    },
    context,
  );
}
