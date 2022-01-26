import { log } from 'meteor/unchained:logger';
import { Context, Root } from '@unchainedshop/types/api';
import { Configuration } from '@unchainedshop/types/common';
import { ProductNotFoundError, InvalidIdError } from '../../../errors';

export default async function requestQuotation(
  root: Root,
  params: { productId: string; configuration: Configuration },
  context: Context
) {
  const { countryContext, modules, userId } = context;
  const { productId, configuration } = params;

  log(
    `mutation requestQuotation ${productId} ${
      configuration ? JSON.stringify(configuration) : ''
    }`,
    { userId }
  );

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
    context
  );
}
