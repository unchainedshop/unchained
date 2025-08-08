import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';
import { ProductTypes, ProductVariationType, ProductConfiguration } from '@unchainedshop/core-products';
import {
  ProductNotFoundError,
  ProductWrongTypeError,
  ProductVariationNotFoundError,
  ProductVariationVectorAlreadySet,
  ProductVariationVectorInvalid,
} from '../../../errors.js';
import { getNormalizedProductDetails } from '../../utils/getNormalizedProductDetails.js';

const extractVariationMatrix = (variations = []) => {
  const cartesianProduct = (arrays) => {
    return arrays.reduce(
      (acc, array) => acc.flatMap((item) => array.map((value) => [...item, value])),
      [[]],
    );
  };
  const keys = variations.map((item) => item.key);
  const options = variations.map((item) => item.options);
  const combinations = cartesianProduct(options);
  return combinations.map((combination) =>
    combination.reduce((acc, value, index) => {
      acc[keys[index]] = value;
      return acc;
    }, {}),
  );
};

const combinationExists = (matrix, combination) => {
  return matrix.some((variation) => {
    return (
      Object.keys(variation).length === Object.keys(combination).length &&
      Object.entries(combination).every(([key, value]) => variation[key] === value)
    );
  });
};

const productVariationTypeKeys = Object.keys(ProductVariationType) as [
  keyof typeof ProductVariationType,
  ...(keyof typeof ProductVariationType)[],
];

const ProductVariationTextInputSchema = z.object({
  locale: z
    .string()
    .min(2)
    .describe(
      'locale iso code like "en-US", "de-CH" use default defaultLanguageIsoCode in shop info if not explicitly provided. if language is explicitly provided check if it exists',
    ),
  title: z.string().describe('variation title/option title in the specified locale'),
  subtitle: z.string().optional().describe('variation/option subtitle in the specified locale'),
});

const ProductAssignmentVectorSchema = z.object({
  key: z.string().min(1).describe('Attribute key (e.g., "Color", "Size")'),
  value: z.string().min(1).describe('Attribute value (e.g., "Red", "M")'),
});

export const ProductVariationsSchema = {
  action: z
    .enum([
      'CREATE_VARIATION',
      'REMOVE_VARIATION',
      'CREATE_OPTION',
      'REMOVE_OPTION',
      'ADD_ASSIGNMENT',
      'REMOVE_ASSIGNMENT',
    ])
    .describe(
      'Variation management action: CREATE_VARIATION (define new variation attributes like Color/Size with enum types), REMOVE_VARIATION (delete entire variation type and all its options), CREATE_OPTION (add specific values like "Red" to Color variation), REMOVE_OPTION (delete specific option values), ADD_ASSIGNMENT (map products to exact variation combinations), REMOVE_ASSIGNMENT (unmap products from variation combinations)',
    ),

  productId: z
    .string()
    .min(1)
    .optional()
    .describe(
      'CONFIGURABLE_PRODUCT ID - the parent product that holds variations. Required for: CREATE_VARIATION, ADD_ASSIGNMENT, REMOVE_ASSIGNMENT. Not needed for: REMOVE_VARIATION, CREATE_OPTION, REMOVE_OPTION (they use productVariationId)',
    ),
  productVariationId: z
    .string()
    .min(1)
    .optional()
    .describe(
      'Specific variation type ID - identifies a single variation like "Color" or "Size". Required for: REMOVE_VARIATION, CREATE_OPTION, REMOVE_OPTION. Not needed for: CREATE_VARIATION, ADD_ASSIGNMENT, REMOVE_ASSIGNMENT (they use productId)',
    ),

  variation: z
    .object({
      key: z.string().min(1).describe('Unique variation key not already used (e.g., "Color", "Size")'),
      type: z.enum(productVariationTypeKeys).describe('Variation type from ProductVariationType enum'),
    })
    .optional()
    .describe('Variation definition for CREATE_VARIATION action'),

  texts: z
    .array(ProductVariationTextInputSchema)
    .optional()
    .describe(
      'Localized titles/subtitles for variations and options (CREATE_VARIATION/CREATE_OPTION actions). Each entry contains locale, title, and optional subtitle. Can be added later via separate text management tools if omitted.',
    ),

  option: z
    .string()
    .min(1)
    .optional()
    .describe(
      'Option value to create (CREATE_OPTION) - e.g., "Red", "Large", "Cotton". Must be unique within the variation type.',
    ),
  productVariationOptionValue: z
    .string()
    .min(1)
    .optional()
    .describe(
      'Existing option value to remove (REMOVE_OPTION action only) - must match exactly. Use option field for CREATE_OPTION.',
    ),

  assignProductId: z
    .string()
    .min(1)
    .optional()
    .describe(
      'Actual product to assign/remove (ADD_ASSIGNMENT/REMOVE_ASSIGNMENT actions). Must be a concrete product (SIMPLE_PRODUCT, etc.) - cannot be another CONFIGURABLE_PRODUCT. This is the product variant that customers will receive.',
    ),
  proxyId: z
    .string()
    .min(1)
    .optional()
    .describe(
      'CONFIGURABLE_PRODUCT ID for assignment operations (ADD_ASSIGNMENT/REMOVE_ASSIGNMENT actions). This is the parent product that holds the variation definitions. Same as productId but used for clarity in assignment contexts.',
    ),
  vectors: z
    .array(ProductAssignmentVectorSchema)
    .optional()
    .describe(
      'Complete variation combination for assignment operations (ADD_ASSIGNMENT/REMOVE_ASSIGNMENT actions). Must include ALL variation options - e.g., if product has Color and Size variations, both must be specified: [{key: "Color", value: "Red"}, {key: "Size", value: "M"}]. Incomplete combinations will fail validation.',
    ),
};

export const ProductVariationsZodSchema = z.object(ProductVariationsSchema);
export type ProductVariationsParams = z.infer<typeof ProductVariationsZodSchema>;

export async function productVariationsManager(context: Context, params: ProductVariationsParams) {
  const { action } = params;
  const { modules, userId } = context;

  try {
    log('handler productVariationsManager', { userId, params });

    switch (action) {
      case 'CREATE_VARIATION': {
        const { productId, variation, texts } = params;
        if (!productId) throw new Error('productId is required for CREATE_VARIATION action');
        if (!variation) throw new Error('variation is required for CREATE_VARIATION action');

        const product = await modules.products.findProduct({ productId });
        if (!product) throw new ProductNotFoundError({ productId });

        if (product.type !== ProductTypes.ConfigurableProduct) {
          throw new ProductWrongTypeError({
            productId,
            received: product.type,
            required: ProductTypes.ConfigurableProduct,
          });
        }

        const newVariation = await modules.products.variations.create({
          options: [],
          productId,
          ...variation,
        });

        if (texts && texts.length > 0) {
          await modules.products.variations.texts.updateVariationTexts(newVariation._id, texts as any);
        }

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                action,
                data: {
                  variation: newVariation,
                  product: await getNormalizedProductDetails(productId, context),
                },
              }),
            },
          ],
        };
      }

      case 'REMOVE_VARIATION': {
        const { productVariationId } = params;
        if (!productVariationId)
          throw new Error('productVariationId is required for REMOVE_VARIATION action');

        const productVariation = await modules.products.variations.findProductVariation({
          productVariationId,
        });
        if (!productVariation) throw new ProductVariationNotFoundError({ productVariationId });

        await modules.products.variations.delete(productVariationId);

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                action,
                data: {
                  removedVariation: productVariation,
                  product: await getNormalizedProductDetails(productVariation.productId, context),
                },
              }),
            },
          ],
        };
      }

      case 'CREATE_OPTION': {
        const { productVariationId, option, texts } = params;
        if (!productVariationId)
          throw new Error('productVariationId is required for CREATE_OPTION action');
        if (!option) throw new Error('option is required for CREATE_OPTION action');

        const variation = await modules.products.variations.findProductVariation({
          productVariationId,
        });
        if (!variation) throw new ProductVariationNotFoundError({ productVariationId });

        const newOption = await modules.products.variations.addVariationOption(productVariationId, {
          value: option,
        });

        if (texts && texts.length > 0) {
          await modules.products.variations.texts.updateVariationTexts(
            productVariationId,
            texts as any,
            option,
          );
        }

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                action,
                data: {
                  variation: newOption,
                  product: await getNormalizedProductDetails(newOption?.productId, context),
                },
              }),
            },
          ],
        };
      }

      case 'REMOVE_OPTION': {
        const { productVariationId, productVariationOptionValue } = params;
        if (!productVariationId)
          throw new Error('productVariationId is required for REMOVE_OPTION action');
        if (!productVariationOptionValue)
          throw new Error('productVariationOptionValue is required for REMOVE_OPTION action');

        const productVariation = await modules.products.variations.findProductVariation({
          productVariationId,
        });
        if (!productVariation) throw new ProductVariationNotFoundError({ productVariationId });

        await modules.products.variations.removeVariationOption(
          productVariationId,
          productVariationOptionValue,
        );

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                action,
                data: {
                  removedOption: productVariationOptionValue,
                  product: await getNormalizedProductDetails(productVariation.productId, context),
                },
              }),
            },
          ],
        };
      }

      case 'ADD_ASSIGNMENT': {
        const { proxyId, assignProductId, vectors } = params;
        if (!proxyId) throw new Error('proxyId is required for ADD_ASSIGNMENT action');
        if (!assignProductId) throw new Error('assignProductId is required for ADD_ASSIGNMENT action');
        if (!vectors || vectors.length === 0)
          throw new Error('vectors is required for ADD_ASSIGNMENT action');

        const proxyProduct = await modules.products.findProduct({
          productId: proxyId,
        });
        if (!proxyProduct) throw new ProductNotFoundError({ proxyId });

        if (proxyProduct.type !== ProductTypes.ConfigurableProduct) {
          throw new ProductWrongTypeError({
            proxyId,
            received: proxyProduct.type,
            required: ProductTypes.ConfigurableProduct,
          });
        }

        const variations = await modules.products.variations.findProductVariations({
          productId: proxyId,
        });
        const variationMatrix = extractVariationMatrix(variations);
        const normalizedVectors = vectors?.reduce((prev, { key, value }) => {
          return {
            ...prev,
            [key]: value,
          };
        }, {});

        if (!combinationExists(variationMatrix, normalizedVectors)) {
          throw new ProductVariationVectorInvalid({ proxyId, vectors });
        }

        const added = await modules.products.assignments.addProxyAssignment({
          productId: assignProductId,
          proxyId,
          vectors: vectors as ProductConfiguration[],
        });

        if (!added) throw new ProductVariationVectorAlreadySet({ proxyId, vectors });

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                action,
                data: {
                  assignment: { productId: assignProductId, vectors },
                  product: await getNormalizedProductDetails(proxyId, context),
                },
              }),
            },
          ],
        };
      }

      case 'REMOVE_ASSIGNMENT': {
        const { proxyId, vectors } = params;
        if (!proxyId) throw new Error('proxyId is required for REMOVE_ASSIGNMENT action');
        if (!vectors || vectors.length === 0)
          throw new Error('vectors is required for REMOVE_ASSIGNMENT action');

        const product = await modules.products.findProduct({ productId: proxyId });
        if (!product) throw new ProductNotFoundError({ productId: proxyId });

        if (product.type !== ProductTypes.ConfigurableProduct) {
          throw new ProductWrongTypeError({
            productId: proxyId,
            received: product.type,
            required: ProductTypes.ConfigurableProduct,
          });
        }

        await modules.products.assignments.removeAssignment(proxyId, { vectors: vectors as any });

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                action,
                data: {
                  removedVectors: vectors,
                  product: await getNormalizedProductDetails(proxyId, context),
                },
              }),
            },
          ],
        };
      }

      default:
        throw new Error(`Unsupported action: ${action}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error in product variations ${action.toLowerCase()}: ${(error as Error).message}`,
        },
      ],
    };
  }
}
