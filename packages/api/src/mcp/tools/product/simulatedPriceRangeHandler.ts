import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';
import { z } from 'zod';
import { ProductWrongTypeError } from '../../../errors.js';
import { getNormalizedProductDetails } from '../../utils/getNormalizedProductDetails.js';

export const ProductAssignmentVectorInputSchema = z.object({
  key: z.string().min(1).describe('Variation attribute key (e.g., "Color")'),
  value: z.string().min(1).describe('Variation attribute value (e.g., "Red")'),
});

export const SimulatedPriceRangeSchema = {
  productId: z.string().min(1).describe('ID of the CONFIGURABLE_PRODUCT to simulate price range for'),
  quantity: z
    .number()
    .int()
    .positive()
    .optional()
    .describe('Desired quantity for price simulation (default is 1)'),
  vectors: z
    .array(ProductAssignmentVectorInputSchema)
    .optional()
    .describe('Optional variation key-value pairs (e.g., Color: Red) to simulate specific variant'),
  includeInactive: z
    .boolean()
    .optional()
    .default(false)
    .describe('Whether to include inactive variants'),
  currencyCode: z
    .string()
    .optional()
    .describe('Currency code to simulate pricing with (e.g., "USD", "EUR")'),
  useNetPrice: z
    .boolean()
    .optional()
    .default(false)
    .describe('Return net price if true, otherwise gross price'),
};

export const SimulatedPriceRangeZodSchema = z.object(SimulatedPriceRangeSchema);

export type SimulatedPriceRangeParams = z.infer<typeof SimulatedPriceRangeZodSchema>;

export async function simulatedPriceRangeHandler(context: Context, params: SimulatedPriceRangeParams) {
  const {
    productId,
    quantity,
    vectors,
    includeInactive,
    currencyCode: forcedCurrencyCode,
    useNetPrice,
  } = params;
  const { modules, userId, countryCode, services } = context;

  try {
    log('handler simulatedPriceRangeHandler', { userId, params });

    const currencyCode = forcedCurrencyCode || context.currencyCode;
    const product = await getNormalizedProductDetails(productId, context);

    if (product.type !== 'CONFIGURABLE_PRODUCT') {
      throw new ProductWrongTypeError({
        productId,
        received: product.type,
        required: 'CONFIGURABLE_PRODUCT',
      });
    }
    const products = await modules.products.proxyProducts(product, vectors as any, {
      includeInactive,
    });

    const filteredPrices = (
      await Promise.all(
        products.map(async (proxyProduct) => {
          const pricingContext = {
            product: proxyProduct,
            user: context.user,
            countryCode,
            currencyCode,
            quantity,
          };

          const pricing = await services.products.simulateProductPricing(pricingContext);
          if (!pricing) return null;
          const unitPrice = pricing.unitPrice({ useNetPrice });

          return {
            ...unitPrice,
            isNetPrice: useNetPrice,
            isTaxable: pricing.taxSum() > 0,
            currencyCode: pricing.currencyCode,
          };
        }),
      )
    ).filter(Boolean);

    if (!filteredPrices.length) return null;

    const { minPrice, maxPrice } = modules.products.prices.priceRange({
      productId: product._id as string,
      prices: filteredPrices,
    });

    const priceRange = {
      minPrice,
      maxPrice,
    };
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ product, priceRange }),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error simulating price range: ${(error as Error).message}`,
        },
      ],
    };
  }
}
