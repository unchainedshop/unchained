import { log } from '@unchainedshop/logger';
import { Context } from '../../../context.js';
import { ProductNotFoundError, InvalidIdError } from '../../../errors.js';
import { resolveBestCurrency } from '@unchainedshop/utils';

export default async function requestQuotation(
  root: never,
  params: { productId: string; configuration: Array<{ key: string; value: string }> },
  context: Context,
) {
  const { countryContext, modules, services, userId } = context;
  const { productId, configuration } = params;

  log(`mutation requestQuotation ${productId} ${configuration ? JSON.stringify(configuration) : ''}`, {
    userId,
  });

  if (!productId) throw new InvalidIdError({ productId });

  if (!(await modules.products.productExists({ productId })))
    throw new ProductNotFoundError({ productId });

  const countryObject = await modules.countries.findCountry({ isoCode: countryContext });
  const currencies = await modules.currencies.findCurrencies({ includeInactive: false });
  const currency = resolveBestCurrency(countryObject.defaultCurrencyCode, currencies);

  const newQuotation = await modules.quotations.create({
    userId,
    productId,
    countryCode: countryContext,
    currency,
    configuration,
  });

  return services.quotations.processQuotation(newQuotation, {}, context);
}
