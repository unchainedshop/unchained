import { z } from 'zod';
import { Context } from '../../../context.js';
import {
  ProductNotFoundError,
  ProductWrongStatusError,
  ProductWrongTypeError,
  ProductVariationNotFoundError,
  ProductMediaNotFoundError,
} from '../../../errors.js';
import { ProductTypes } from '@unchainedshop/core-products';
import { getNormalizedProductDetails } from '../../utils/getNormalizedProductDetails.js';
import { log } from '@unchainedshop/logger';

const ProductPlanUsageCalculationTypeEnum = z.enum(['LICENSED', 'METERED'], {
  description:
    'Determines how usage is calculated for the product plan. LICENSED means a fixed license count, METERED means usage is tracked dynamically.',
});

const ProductPlanConfigurationIntervalEnum = z.enum(['HOURS', 'DAYS', 'WEEKS', 'MONTHS', 'YEARS'], {
  description:
    'Defines the time unit for billing intervals and trial periods (e.g., MONTHS means billing every month).',
});

const UpdateProductPlanInputSchema = z.object({
  usageCalculationType: ProductPlanUsageCalculationTypeEnum.describe(
    'The billing usage calculation method for the product plan.',
  ),
  billingInterval: ProductPlanConfigurationIntervalEnum.describe(
    'The interval unit used for billing cycles.',
  ),
  billingIntervalCount: z
    .number()
    .int()
    .positive()
    .describe('The number of billing intervals per billing cycle (e.g., 3 for every 3 months).'),
  trialInterval: ProductPlanConfigurationIntervalEnum.optional().describe(
    'Optional trial period interval unit before billing starts.',
  ),
  trialIntervalCount: z
    .number()
    .int()
    .positive()
    .optional()
    .describe('Number of trial intervals before the billing cycle starts.'),
});

const ProductTextInputSchema = z.object({
  locale: z
    .string()
    .min(2)
    .describe(
      'locale iso code like "en-US", "de-CH" use default defaultLanguageIsoCode in shop info if not explicitly provided. if language is explicitly provided check if it exists',
    ),
  slug: z.string().optional().describe('URL slug'),
  title: z.string().optional().describe('Product title'),
  subtitle: z.string().optional().describe('Product subtitle'),
  description: z.string().optional().describe('Markdown description'),
  vendor: z.string().optional().describe('Vendor name'),
  brand: z.string().optional().describe('Brand name'),
  labels: z.array(z.string()).optional().describe('Labels or tags'),
});

const ProductVariationTextInputSchema = z.object({
  locale: z.string().min(1).describe('Locale code (e.g., "en", "de")'),
  title: z.string().optional().describe('Title of the variation in the given locale'),
  subtitle: z.string().optional().describe('Subtitle of the variation in the given locale'),
});

const ProductMediaTextInputSchema = z.object({
  locale: z
    .string()
    .min(2)
    .describe(
      'locale iso code like "en-US", "de-CH" use default defaultLanguageIsoCode in shop info if not explicitly provided. if language is explicitly provided check if it exists',
    ),
  title: z.string().optional().describe('Title in the given locale'),
  subtitle: z.string().optional().describe('Subtitle in the given locale'),
});

export const UpdateProductSchema = {
  productId: z.string().min(1).describe('ID of the product to update'),
  product: z
    .object({
      tags: z
        .array(z.string().min(1).toLowerCase())
        .optional()
        .describe('List of lowercase tags - Available for ALL product types'),
      sequence: z
        .number()
        .int()
        .optional()
        .describe('Sorting sequence - Available for ALL product types'),
      meta: z
        .record(z.unknown())
        .optional()
        .describe('Custom metadata as key-value pairs - Available for ALL product types'),
      plan: UpdateProductPlanInputSchema.optional().describe(
        'Configuration settings for the product plan - ONLY for PLAN_PRODUCT type. Will throw error if used with other product types.',
      ),
      warehousing: z
        .object({
          sku: z.string().min(1).optional().describe('Stock keeping unit'),
          baseUnit: z
            .string()
            .min(1)
            .optional()
            .describe('Base unit of the product (e.g., "piece", "kg")'),
        })
        .optional()
        .describe(
          'Warehousing details - ONLY for SIMPLE_PRODUCT type. Will throw ProductWrongTypeError if used with other product types.',
        ),
      supply: z
        .object({
          weightInGram: z
            .number()
            .int()
            .positive()
            .optional()
            .describe('Weight of the product in grams'),
          heightInMillimeters: z
            .number()
            .int()
            .positive()
            .optional()
            .describe('Height of the product in millimeters'),
          lengthInMillimeters: z
            .number()
            .int()
            .positive()
            .optional()
            .describe('Length of the product in millimeters'),
          widthInMillimeters: z
            .number()
            .int()
            .positive()
            .optional()
            .describe('Width of the product in millimeters'),
        })
        .optional()
        .describe(
          'Supply (delivery) attributes - ONLY for SIMPLE_PRODUCT type. Will throw ProductWrongTypeError if used with other product types.',
        ),
      tokenization: z
        .object({
          contractAddress: z.string().min(1).describe('Blockchain contract address'),
          contractStandard: z.string().describe('Standard of the smart contract (e.g., ERC-721)'),
          tokenId: z.string().min(1).describe('Unique token identifier'),
          supply: z.number().int().positive().describe('Total supply of the token'),
          ercMetadataProperties: z
            .record(z.any())
            .optional()
            .describe('Optional ERC metadata properties'),
        })
        .optional()
        .describe(
          'Tokenization details - ONLY for TOKENIZED_PRODUCT type. Will throw ProductWrongStatusError if used with other product types.',
        ),
      commerce: z
        .object({
          pricing: z
            .array(
              z.object({
                amount: z
                  .number()
                  .int()
                  .describe('Price amount in smallest currency unit (e.g., cents)'),
                maxQuantity: z
                  .number()
                  .int()
                  .optional()
                  .describe('Optional maximum quantity for this price tier'),
                isTaxable: z.boolean().optional().describe('Whether tax applies to this price'),
                isNetPrice: z.boolean().optional().describe('Whether this is a net price (without tax)'),
                currencyCode: z
                  .string()
                  .min(3)
                  .max(3)
                  .describe(
                    'ISO currency code (e.g., USD, EUR) always use values registered in the system and if explicitly provided check if it exists',
                  ),
                countryCode: z
                  .string()
                  .min(2)
                  .max(2)
                  .describe(
                    'ISO country code (e.g., US, DE) always use values registered in the system and if explicitly provided check if it exists',
                  ),
              }),
            )
            .nonempty()
            .describe('List of price configurations'),
        })
        .optional()
        .describe(
          'Commerce info (pricing) - Available for ALL product types EXCEPT CONFIGURABLE_PRODUCT & BUNDLE_PRODUCT',
        ),
      texts: z
        .array(ProductTextInputSchema)
        .optional()
        .describe(
          'Localized product text entries (title, subtitle, description, slug, vendor, brand, labels) - Available for ALL product types',
        ),
    })
    .describe(
      'Fields to update on the product. Product type restrictions are enforced at runtime and will throw errors if violated.',
    ),
  productVariationId: z
    .string()
    .optional()
    .describe(
      'ID of the product variation to update texts for - Use this when updating variation-specific texts instead of main product texts',
    ),
  productVariationOptionValue: z
    .string()
    .optional()
    .describe(
      'Optional production option value to filter variations when updating variation texts - Used with productVariationId',
    ),
  variationTexts: z
    .array(ProductVariationTextInputSchema)
    .optional()
    .describe(
      'Localized texts for product variation (requires productVariationId) - Only for products that have variations',
    ),
  productMediaId: z
    .string()
    .optional()
    .describe(
      'ID of the media asset to update texts for - Use this when updating media-specific texts instead of main product texts',
    ),
  mediaTexts: z
    .array(ProductMediaTextInputSchema)
    .optional()
    .describe(
      'Localized texts for product media (requires productMediaId) - Only for products that have media assets',
    ),
};

export const UpdateProductZodSchema = z.object(UpdateProductSchema);

export type UpdateProductParams = z.infer<typeof UpdateProductZodSchema>;

export async function updateProductHandler(context: Context, params: UpdateProductParams) {
  const {
    productId,
    product,
    productVariationId,
    productVariationOptionValue,
    variationTexts,
    productMediaId,
    mediaTexts,
  } = params;
  const { modules, userId } = context;

  try {
    log('handler updateProductHandler', { userId, params });

    if (productVariationId && variationTexts) {
      const productVariation = await modules.products.variations.findProductVariation({
        productVariationId,
      });
      if (!productVariation) throw new ProductVariationNotFoundError({ productVariationId });

      const updatedTexts = await modules.products.variations.texts.updateVariationTexts(
        productVariationId,
        variationTexts as any,
        productVariationOptionValue,
      );
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({ texts: updatedTexts, productId: productVariation.productId }),
          },
        ],
      };
    }

    if (productMediaId && mediaTexts) {
      const productMedia = await modules.products.media.findProductMedia({
        productMediaId,
      });
      if (!productMedia) throw new ProductMediaNotFoundError({ productMediaId });

      const updatedTexts = await modules.products.media.texts.updateMediaTexts(
        productMediaId,
        mediaTexts,
      );
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({ texts: updatedTexts, productId: productMedia.productId }),
          },
        ],
      };
    }

    const existingProduct = await modules.products.findProduct({ productId });
    if (!existingProduct) throw new ProductNotFoundError({ productId });

    const updateData: any = {};

    if (product.tags !== undefined) updateData.tags = product.tags;
    if (product.sequence !== undefined) updateData.sequence = product.sequence;
    if (product.meta !== undefined) updateData.meta = product.meta;

    if (product.plan !== undefined) {
      if (existingProduct.type !== ProductTypes.PlanProduct) {
        throw new ProductWrongStatusError({
          received: existingProduct.type,
          required: ProductTypes.PlanProduct,
        });
      }
      updateData.plan = product.plan;
    }

    if (product.warehousing !== undefined) {
      if (existingProduct.type !== ProductTypes.SimpleProduct) {
        throw new ProductWrongTypeError({
          productId,
          received: existingProduct.type,
          required: ProductTypes.SimpleProduct,
        });
      }
      updateData.warehousing = product.warehousing;
    }

    if (product.supply !== undefined) {
      if (existingProduct.type !== ProductTypes.SimpleProduct) {
        throw new ProductWrongTypeError({
          productId,
          received: existingProduct.type,
          required: ProductTypes.SimpleProduct,
        });
      }
      updateData.supply = product.supply;
    }

    if (product.tokenization !== undefined) {
      if (existingProduct.type !== ProductTypes.TokenizedProduct) {
        throw new ProductWrongStatusError({
          received: existingProduct.type,
          required: ProductTypes.TokenizedProduct,
        });
      }
      updateData.tokenization = product.tokenization;
    }

    if (product.commerce !== undefined) {
      updateData.commerce = product.commerce;
    }

    if (Object.keys(updateData).length > 0) {
      await modules.products.update(productId, updateData);
    }

    if (product.texts && product.texts.length > 0) {
      await modules.products.texts.updateTexts(productId, product.texts as any[]);
    }

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            product: await getNormalizedProductDetails(productId, context),
          }),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error updating product: ${(error as Error).message}`,
        },
      ],
    };
  }
}
