import { Context } from '../../../context.js';
import { ProductNotFoundError } from '../../../errors.js';
import { getNormalizedProductDetails } from '../../utils/getNormalizedProductDetails.js';
import { log } from '@unchainedshop/logger';
import { z } from 'zod';

export const CatalogPriceSchema = {
  productId: z.string().min(1).describe('ID of the product to retrieve catalog price for'),
  quantity: z
    .number()
    .int()
    .positive()
    .default(1)
    .describe('Quantity to calculate catalog price for (default is 1)'),
  currencyCode: z
    .string()
    .optional()
    .describe('Optional currency code (e.g., "USD") for price calculation'),
};

export const CatalogPriceZodSchema = z.object(CatalogPriceSchema);
export type CatalogPriceParams = z.infer<typeof CatalogPriceZodSchema>;

export async function catalogPriceHandler(context: Context, params: CatalogPriceParams) {
  const { productId, quantity, currencyCode: forcedCurrencyCode } = params;
  const { modules, countryCode, currencyCode: defaultCurrencyCode, userId } = context;

  try {
    log('handler catalogPriceHandler', { userId, params });
    const product = await getNormalizedProductDetails(productId, context);
    if (!product) throw new ProductNotFoundError({ productId });
    const currencyCode = forcedCurrencyCode || defaultCurrencyCode;
    const catalogPrice = await modules.products.prices.price(product, {
      countryCode,
      currencyCode,
      quantity,
    });
    const leveledCatalogPrice = await modules.products.prices.catalogPricesLeveled(product, {
      currencyCode,
      countryCode,
    });
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ product, price: catalogPrice, leveledCatalogPrice }),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error retrieving catalog price: ${(error as Error).message}`,
        },
      ],
    };
  }
}
