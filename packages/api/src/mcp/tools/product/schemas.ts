import { z } from 'zod/v4-mini';
import { SortDirection } from '@unchainedshop/utils';
import { ProductType, ProductVariationType } from '@unchainedshop/core-products';
import {
  PaginationSchema,
  SortingSchema,
  SearchSchema,
  LocalizationTextSchema,
  createManagementSchemaFromValidators,
} from '../../utils/sharedSchemas.ts';

export const productTypeKeys = Object.keys(ProductType) as [string, ...string[]];
export const productVariationTypeKeys = Object.keys(ProductVariationType) as [string, ...string[]];
export const sortDirectionKeys = Object.keys(SortDirection) as [string, ...string[]];

export const ProductPlanUsageCalculationTypeEnum = z.enum(['LICENSED', 'METERED']);
export const ProductPlanConfigurationIntervalEnum = z.enum([
  'HOURS',
  'DAYS',
  'WEEKS',
  'MONTHS',
  'YEARS',
]);

export const UpdateProductPlanInputSchema = z.object({
  usageCalculationType: ProductPlanUsageCalculationTypeEnum.check(
    z.describe('The billing usage calculation method'),
  ),
  billingInterval: ProductPlanConfigurationIntervalEnum.check(
    z.describe('The interval unit for billing cycles'),
  ),
  billingIntervalCount: z.int().check(z.positive(), z.describe('Number of billing intervals per cycle')),
  trialInterval: z
    .optional(ProductPlanConfigurationIntervalEnum)
    .check(z.describe('Optional trial period interval')),
  trialIntervalCount: z
    .optional(z.int().check(z.positive()))
    .check(z.describe('Number of trial intervals')),
});

export const ProductTextInputSchema = z
  .extend(LocalizationTextSchema, {
    slug: z.optional(z.string()).check(z.describe('URL slug')),
    description: z.optional(z.string()).check(z.describe('Markdown description')),
    vendor: z.optional(z.string()).check(z.describe('Vendor name')),
    brand: z.optional(z.string()).check(z.describe('Brand name')),
    labels: z.optional(z.array(z.string())).check(z.describe('Labels or tags')),
  })
  .check(z.describe('Product localized text data'));

export const ProductVariationTextInputSchema = LocalizationTextSchema.check(
  z.describe('Product variation localized text data'),
);

export const ProductMediaTextInputSchema = LocalizationTextSchema.check(
  z.describe('Product media localized text data'),
);

export const ProductAssignmentVectorSchema = z.object({
  key: z.string().check(z.minLength(1), z.describe('Attribute key (e.g., "Color", "Size")')),
  value: z.string().check(z.minLength(1), z.describe('Attribute value (e.g., "Red", "M")')),
});

export const ProductSchema = z.object({
  type: z.optional(z.enum(productTypeKeys)).check(z.describe('Product type (required for CREATE)')),
  tags: z
    .optional(z.array(z.string().check(z.minLength(1), z.toLowerCase())))
    .check(z.describe('Tags (lowercased strings)')),
  sequence: z.optional(z.int()).check(z.describe('Sorting sequence')),
  meta: z.optional(z.record(z.any(), z.any())).check(z.describe('Custom metadata as key-value pairs')),
  plan: z
    .optional(UpdateProductPlanInputSchema)
    .check(z.describe('Plan configuration - ONLY for PLAN_PRODUCT')),
  warehousing: z
    .optional(
      z.object({
        sku: z.optional(z.string().check(z.minLength(1))).check(z.describe('Stock keeping unit')),
        baseUnit: z
          .optional(z.string().check(z.minLength(1)))
          .check(z.describe('Base unit (e.g., "piece", "kg")')),
      }),
    )
    .check(z.describe('Warehousing details - ONLY for SIMPLE_PRODUCT')),
  supply: z
    .optional(
      z.object({
        weightInGram: z.optional(z.int().check(z.positive())).check(z.describe('Weight in grams')),
        heightInMillimeters: z
          .optional(z.int().check(z.positive()))
          .check(z.describe('Height in millimeters')),
        lengthInMillimeters: z
          .optional(z.int().check(z.positive()))
          .check(z.describe('Length in millimeters')),
        widthInMillimeters: z
          .optional(z.int().check(z.positive()))
          .check(z.describe('Width in millimeters')),
      }),
    )
    .check(z.describe('Supply attributes - ONLY for SIMPLE_PRODUCT')),
  tokenization: z
    .optional(
      z.object({
        contractAddress: z.string().check(z.minLength(1), z.describe('Blockchain contract address')),
        contractStandard: z.string().check(z.describe('Smart contract standard (e.g., ERC-721)')),
        tokenId: z.string().check(z.minLength(1), z.describe('Unique token identifier')),
        supply: z.int().check(z.positive(), z.describe('Total supply of the token')),
        ercMetadataProperties: z
          .optional(z.record(z.any(), z.any()))
          .check(z.describe('Optional ERC metadata properties')),
      }),
    )
    .check(z.describe('Tokenization details - ONLY for TOKENIZED_PRODUCT')),
  commerce: z
    .optional(
      z.object({
        pricing: z
          .array(
            z.object({
              amount: z.int().check(z.describe('Price amount in smallest currency unit.')),
              maxQuantity: z
                .optional(z.int())
                .check(z.describe('Optional maximum quantity for this price tier')),
              isTaxable: z.optional(z.boolean()).check(z.describe('Whether tax applies to this price')),
              isNetPrice: z
                .optional(z.boolean())
                .check(z.describe('Whether this is a net price (without tax)')),
              currencyCode: z
                .string()
                .check(
                  z.minLength(3),
                  z.maxLength(3),
                  z.describe(
                    'ISO currency code (e.g., USD, EUR). Must match an available currency from the shop currencies resource. If it does not exist, prompt the user to add the currency. NEVER add it automatically unless explicitly specified by the user.',
                  ),
                ),
              countryCode: z
                .string()
                .check(
                  z.minLength(2),
                  z.maxLength(2),
                  z.describe(
                    'ISO country code (e.g., US, DE). Must match an available country from the shop countries resource. If it does not exist, prompt the user to add the country. NEVER add it automatically unless explicitly specified by the user.',
                  ),
                ),
            }),
          )
          .check(
            z.minLength(1),
            z.describe(
              'List of price configurations. Use only countryCode and currencyCode values from the shop resources.',
            ),
          ),
      }),
    )
    .check(
      z.describe(
        'Commerce info - Available for ALL except CONFIGURABLE_PRODUCT. Use only registered countries and currencies from shop resources.',
      ),
    ),
});

export const actionValidators = {
  CREATE: z.object({
    product: z
      .extend(ProductSchema, {
        type: z.enum(productTypeKeys).check(z.describe('Product type (required for CREATE)')),
      })
      .check(z.describe('Product data with type required')),
    texts: z
      .optional(z.array(ProductTextInputSchema))
      .check(z.describe('Localized product text entries')),
  }),

  UPDATE: z.object({
    productId: z.string().check(z.minLength(1), z.describe('Product ID')),
    product: ProductSchema.check(z.describe('Product data to update')),
  }),

  REMOVE: z.object({
    productId: z
      .string()
      .check(
        z.minLength(1),
        z.describe(
          'Product ID, (the product status to remove must be inactive or in DRAFT state other wise it will throw error) so if it is active please unpublish it first before removing the product',
        ),
      ),
  }),

  GET: z
    .object({
      productId: z.optional(z.string().check(z.minLength(1))).check(z.describe('Product ID')),
      slug: z.optional(z.string()).check(z.describe('Product slug')),
      sku: z.optional(z.string()).check(z.describe('Product SKU')),
    })
    .check(
      z.refine((data) => data.productId || data.slug || data.sku, {
        message: 'Either productId, slug, or sku is required',
      }),
    ),

  LIST: z.object({
    ...PaginationSchema,
    ...SortingSchema,
    ...SearchSchema,
    tags: z
      .optional(z.array(z.string().check(z.minLength(1), z.toLowerCase())))
      .check(z.describe('Filter by tags')),
    slugs: z
      .optional(z.array(z.string().check(z.minLength(1))))
      .check(z.describe('Filter by product slugs')),
    includeDrafts: z.optional(z.boolean()).check(z.describe('Include draft/unpublished products')),
  }),

  COUNT: z.object({
    ...SearchSchema,
    tags: z
      .optional(z.array(z.string().check(z.minLength(1), z.toLowerCase())))
      .check(z.describe('Filter by tags')),
    slugs: z
      .optional(z.array(z.string().check(z.minLength(1))))
      .check(z.describe('Filter by product slugs')),
    includeDrafts: z.optional(z.boolean()).check(z.describe('Include draft/unpublished products')),
  }),

  UPDATE_STATUS: z.object({
    productId: z.string().check(z.minLength(1), z.describe('Product ID')),
    statusAction: z.enum(['PUBLISH', 'UNPUBLISH']).check(z.describe('Status action')),
  }),

  ADD_MEDIA: z.object({
    productId: z.string().check(z.minLength(1), z.describe('Product ID')),
    mediaName: z.string().check(z.minLength(1), z.describe('Media file name')),
    url: z.url().check(z.describe('Media URL')),
  }),

  REMOVE_MEDIA: z.object({
    productMediaId: z.string().check(z.minLength(1), z.describe('Product media ID')),
  }),

  REORDER_MEDIA: z.object({
    sortKeys: z
      .array(
        z.object({
          productMediaId: z.string().check(z.minLength(1), z.describe('Media asset ID')),
          sortKey: z.int().check(z.describe('New sort position')),
        }),
      )
      .check(z.minLength(1), z.describe('Sort keys')),
  }),

  GET_MEDIA: z.object({
    productId: z.string().check(z.minLength(1), z.describe('Product ID')),
    tags: z
      .optional(z.array(z.string().check(z.minLength(1), z.toLowerCase())))
      .check(z.describe('Filter by tags')),
    ...PaginationSchema,
  }),

  UPDATE_MEDIA_TEXTS: z.object({
    productMediaId: z.string().check(z.minLength(1), z.describe('Product media ID')),
    mediaTexts: z.array(ProductMediaTextInputSchema).check(z.describe('Media texts')),
  }),

  CREATE_VARIATION: z.object({
    productId: z.string().check(z.minLength(1), z.describe('Product ID')),
    variation: z
      .object({
        key: z
          .string()
          .check(z.minLength(1), z.describe('Unique variation key (e.g., "Color", "Size")')),
        type: z.enum(productVariationTypeKeys).check(z.describe('Variation type')),
      })
      .check(z.describe('Variation definition')),
    variationTexts: z
      .optional(z.array(ProductVariationTextInputSchema))
      .check(z.describe('Variation texts')),
  }),

  REMOVE_VARIATION: z.object({
    productVariationId: z.string().check(z.minLength(1), z.describe('Product variation ID')),
  }),

  ADD_VARIATION_OPTION: z.object({
    productVariationId: z.string().check(z.minLength(1), z.describe('Product variation ID')),
    option: z.string().check(z.minLength(1), z.describe('Option value')),
    variationTexts: z
      .optional(z.array(ProductVariationTextInputSchema))
      .check(z.describe('Variation texts')),
  }),

  REMOVE_VARIATION_OPTION: z.object({
    productVariationId: z.string().check(z.minLength(1), z.describe('Product variation ID')),
    productVariationOptionValue: z.string().check(z.minLength(1), z.describe('Option value')),
  }),

  UPDATE_VARIATION_TEXTS: z.object({
    productVariationId: z.string().check(z.minLength(1), z.describe('Product variation ID')),
    variationTexts: z.array(ProductVariationTextInputSchema).check(z.describe('Variation texts')),
    productVariationOptionValue: z
      .optional(z.string().check(z.minLength(1)))
      .check(z.describe('Option value')),
  }),

  GET_VARIATION_PRODUCTS: z.object({
    productId: z.string().check(z.minLength(1), z.describe('Product ID')),
    vectors: z.array(ProductAssignmentVectorSchema).check(z.describe('Variation vectors')),
    includeInactive: z._default(z.boolean(), true).check(z.describe('Include inactive products')),
  }),

  GET_ASSIGNMENTS: z.object({
    productId: z.string().check(z.minLength(1), z.describe('Product ID')),
    includeInactive: z.optional(z.boolean()).check(z.describe('Include inactive assignments')),
  }),

  ADD_ASSIGNMENT: z.object({
    proxyId: z.string().check(z.minLength(1), z.describe('Proxy product ID')),
    assignProductId: z.string().check(z.minLength(1), z.describe('Product to assign')),
    vectors: z.array(ProductAssignmentVectorSchema).check(z.describe('Variation vectors')),
  }),

  REMOVE_ASSIGNMENT: z.object({
    proxyId: z.string().check(z.minLength(1), z.describe('Proxy product ID')),
    vectors: z.array(ProductAssignmentVectorSchema).check(z.describe('Variation vectors')),
  }),

  ADD_BUNDLE_ITEM: z.object({
    bundleId: z.string().check(z.minLength(1), z.describe('Bundle product ID')),
    bundleProductId: z.string().check(z.minLength(1), z.describe('Product to add to bundle')),
    quantity: z._default(z.int().check(z.positive()), 1).check(z.describe('Quantity')),
  }),

  REMOVE_BUNDLE_ITEM: z.object({
    bundleId: z.string().check(z.minLength(1), z.describe('Bundle product ID')),
    index: z.int().check(z.gte(0), z.describe('Bundle item index')),
  }),

  GET_BUNDLE_ITEMS: z.object({
    bundleId: z.string().check(z.minLength(1), z.describe('Bundle product ID')),
  }),

  GET_CATALOG_PRICE: z.object({
    productId: z.string().check(z.minLength(1), z.describe('Product ID')),
    quantity: z.optional(z.int().check(z.positive())).check(z.describe('Quantity')),
    currencyCode: z
      .optional(z.string().check(z.minLength(3), z.maxLength(3)))
      .check(z.describe('ISO currency code')),
  }),

  SIMULATE_PRICE: z.object({
    productId: z.string().check(z.minLength(1), z.describe('Product ID')),
    vectors: z.optional(z.array(ProductAssignmentVectorSchema)).check(z.describe('Variation vectors')),
    quantity: z.optional(z.int().check(z.positive())).check(z.describe('Quantity')),
    currencyCode: z
      .optional(z.string().check(z.minLength(3), z.maxLength(3)))
      .check(z.describe('ISO currency code')),
    useNetPrice: z.optional(z.boolean()).check(z.describe('Whether to use net price')),
  }),

  SIMULATE_PRICE_RANGE: z.object({
    productId: z.string().check(z.minLength(1), z.describe('Product ID')),
    vectors: z.optional(z.array(ProductAssignmentVectorSchema)).check(z.describe('Variation vectors')),
    quantity: z.optional(z.int().check(z.positive())).check(z.describe('Quantity')),
    currencyCode: z
      .optional(z.string().check(z.minLength(3), z.maxLength(3)))
      .check(z.describe('ISO currency code')),
    useNetPrice: z.optional(z.boolean()).check(z.describe('Whether to use net price')),
  }),

  GET_PRODUCT_TEXTS: z.object({
    productId: z.string().check(z.minLength(1), z.describe('Product ID')),
  }),

  GET_VARIATION_TEXTS: z.object({
    productVariationId: z.string().check(z.minLength(1), z.describe('Product variation ID')),
    productVariationOptionValue: z
      .optional(z.string().check(z.minLength(1)))
      .check(z.describe('Option value')),
  }),

  GET_MEDIA_TEXTS: z.object({
    productMediaId: z.string().check(z.minLength(1), z.describe('Product media ID')),
  }),

  GET_REVIEWS: z.object({
    productId: z.string().check(z.minLength(1), z.describe('Product ID')),
    ...PaginationSchema,
    ...SortingSchema,
    ...SearchSchema,
  }),

  COUNT_REVIEWS: z.object({
    productId: z.string().check(z.minLength(1), z.describe('Product ID')),
    ...SearchSchema,
  }),

  GET_SIBLINGS: z.object({
    productId: z.string().check(z.minLength(1), z.describe('Product ID')),
    assortmentId: z.optional(z.string()).check(z.describe('Assortment ID')),
    includeInactive: z.optional(z.boolean()).check(z.describe('Include inactive products')),
  }),

  UPDATE_PRODUCT_TEXTS: z.object({
    productId: z.string().check(z.minLength(1), z.describe('Product ID')),
    texts: z.array(ProductTextInputSchema).check(z.describe('Product texts to update')),
  }),
} as const;

export const ProductManagementSchema = createManagementSchemaFromValidators(actionValidators);

export type { ManagementParams as ProductManagementParams } from '../../utils/sharedSchemas.ts';

export type ActionName = keyof typeof actionValidators;
export type Params<T extends ActionName> = z.infer<(typeof actionValidators)[T]>;
export type Handler<T extends ActionName> = (productModule: any, params: Params<T>) => Promise<unknown>;
