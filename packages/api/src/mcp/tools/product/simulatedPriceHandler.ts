import { Context } from '../../../context.js';
import { ProductNotFoundError } from '../../../errors.js';
import { log } from '@unchainedshop/logger';
import { z } from 'zod';
import { getNormalizedProductDetails } from '../../utils/getNormalizedProductDetails.js';

export const ProductConfigurationParameterInputSchema = z.object({
  key: z.string().min(1).describe('Configuration attribute key'),
  value: z.string().min(1).describe('Configuration attribute value'),
});

export const SimulatedPriceSchema = {
  productId: z.string().min(1).describe('ID of the product for which to simulate pricing'),
  quantity: z
    .number()
    .int()
    .positive()
    .default(1)
    .describe('Quantity to simulate price for (default is 1)'),
  currencyCode: z.string().optional().describe('Currency code for price simulation (e.g., "USD")'),
  useNetPrice: z
    .boolean()
    .optional()
    .default(false)
    .describe('If true, returns net price; otherwise, returns gross price'),
  configuration: z
    .array(ProductConfigurationParameterInputSchema)
    .optional()
    .describe('Complete configuration vector (e.g., Color: Red, Size: M)'),
};

export const SimulatedPriceZodSchema = z.object(SimulatedPriceSchema);

export type SimulatedPriceParams = z.infer<typeof SimulatedPriceZodSchema>;

export async function simulatedPriceHandler(context: Context, params: SimulatedPriceParams) {
  const { userId, countryCode, user, services } = context;
  const { productId, quantity, configuration, currencyCode: forcedCurrencyCode, useNetPrice } = params;

  try {
    log('handler simulatedPriceHandler', { userId, params });

    const product = await getNormalizedProductDetails(productId, context);
    if (!product) throw new ProductNotFoundError({ productId });
    const currencyCode = forcedCurrencyCode || context.currencyCode;
    const pricingContext = {
      product,
      user,
      countryCode,
      currencyCode,
      quantity,
      configuration,
    };
    const pricing = await services.products.simulateProductPricing(pricingContext as any);
    const unitPrice = pricing.unitPrice({ useNetPrice });

    const price = {
      ...unitPrice,
      isNetPrice: useNetPrice,
      isTaxable: pricing.taxSum() > 0,
      currencyCode: pricing.currencyCode,
    };

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ product, price }),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error simulating price: ${(error as Error).message}`,
        },
      ],
    };
  }
}
