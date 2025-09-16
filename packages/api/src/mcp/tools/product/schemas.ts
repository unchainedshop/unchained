import { z } from 'zod';
import { SortDirection } from '@unchainedshop/utils';
import { ProductTypes, ProductVariationType } from '@unchainedshop/core-products';
import {
  PaginationSchema,
  SortingSchema,
  SearchSchema,
  LocalizationTextSchema,
} from '../../utils/sharedSchemas.js';

export const productTypeKeys = Object.keys(ProductTypes) as [string, ...string[]];
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
  usageCalculationType: ProductPlanUsageCalculationTypeEnum.describe(
    'The billing usage calculation method',
  ),
  billingInterval: ProductPlanConfigurationIntervalEnum.describe('The interval unit for billing cycles'),
  billingIntervalCount: z.number().int().positive().describe('Number of billing intervals per cycle'),
  trialInterval: ProductPlanConfigurationIntervalEnum.optional().describe(
    'Optional trial period interval',
  ),
  trialIntervalCount: z.number().int().positive().optional().describe('Number of trial intervals'),
});

export const ProductTextInputSchema = LocalizationTextSchema.extend({
  slug: z.string().optional().describe('URL slug'),
  description: z.string().optional().describe('Markdown description'),
  vendor: z.string().optional().describe('Vendor name'),
  brand: z.string().optional().describe('Brand name'),
  labels: z.array(z.string()).optional().describe('Labels or tags'),
}).describe('Product localized text data');

export const ProductVariationTextInputSchema = LocalizationTextSchema.describe(
  'Product variation localized text data',
);

export const ProductMediaTextInputSchema = LocalizationTextSchema.describe(
  'Product media localized text data',
);

export const ProductAssignmentVectorSchema = z.object({
  key: z.string().min(1).describe('Attribute key (e.g., "Color", "Size")'),
  value: z.string().min(1).describe('Attribute value (e.g., "Red", "M")'),
});

export const ProductSchema = z.object({
  type: z.enum(productTypeKeys).optional().describe('Product type (required for CREATE)'),
  tags: z.array(z.string().min(1).toLowerCase()).optional().describe('Tags (lowercased strings)'),
  sequence: z.number().int().optional().describe('Sorting sequence'),
  meta: z.record(z.unknown()).optional().describe('Custom metadata as key-value pairs'),
  plan: UpdateProductPlanInputSchema.optional().describe('Plan configuration - ONLY for PLAN_PRODUCT'),
  warehousing: z
    .object({
      sku: z.string().min(1).optional().describe('Stock keeping unit'),
      baseUnit: z.string().min(1).optional().describe('Base unit (e.g., "piece", "kg")'),
    })
    .optional()
    .describe('Warehousing details - ONLY for SIMPLE_PRODUCT'),
  supply: z
    .object({
      weightInGram: z.number().int().positive().optional().describe('Weight in grams'),
      heightInMillimeters: z.number().int().positive().optional().describe('Height in millimeters'),
      lengthInMillimeters: z.number().int().positive().optional().describe('Length in millimeters'),
      widthInMillimeters: z.number().int().positive().optional().describe('Width in millimeters'),
    })
    .optional()
    .describe('Supply attributes - ONLY for SIMPLE_PRODUCT'),
  tokenization: z
    .object({
      contractAddress: z.string().min(1).describe('Blockchain contract address'),
      contractStandard: z.string().describe('Smart contract standard (e.g., ERC-721)'),
      tokenId: z.string().min(1).describe('Unique token identifier'),
      supply: z.number().int().positive().describe('Total supply of the token'),
      ercMetadataProperties: z.record(z.any()).optional().describe('Optional ERC metadata properties'),
    })
    .optional()
    .describe('Tokenization details - ONLY for TOKENIZED_PRODUCT'),
  commerce: z
    .object({
      pricing: z
        .array(
          z.object({
            amount: z.number().int().describe('Price amount in smallest currency unit.'),
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
                'ISO currency code (e.g., USD, EUR) make sure the currency code provided exists in the system currencies before using it. if it does not exists prompt the user to add the currency. NEVER add it automatically',
              ),
            countryCode: z
              .string()
              .min(2)
              .max(2)
              .describe(
                'ISO country code (e.g., US, DE) make sure the country/countryCode exists in the system before using it. if it does not exists prompt the user to add the country. NEVER add it automatically',
              ),
          }),
        )
        .nonempty()
        .describe(
          "List of price configurations always use country and currency codes that are already registered in the system, don't use non existing iso codes.",
        ),
    })
    .optional()
    .describe('Commerce info - Available for ALL except CONFIGURABLE_PRODUCT'),
});

export const actionValidators = {
  CREATE: z.object({
    product: ProductSchema.extend({
      type: z.enum(productTypeKeys).describe('Product type (required for CREATE)'),
    }).describe('Product data with type required'),
    texts: z.array(ProductTextInputSchema).optional().describe('Localized product text entries'),
  }),

  UPDATE: z.object({
    productId: z.string().min(1).describe('Product ID'),
    product: ProductSchema.describe('Product data to update'),
  }),

  REMOVE: z.object({
    productId: z
      .string()
      .min(1)
      .describe(
        'Product ID, (the product to remove must be inactive or in DRAFT state other wise it will throw error)',
      ),
  }),

  GET: z
    .object({
      productId: z.string().min(1).optional().describe('Product ID'),
      slug: z.string().optional().describe('Product slug'),
      sku: z.string().optional().describe('Product SKU'),
    })
    .refine((data) => data.productId || data.slug || data.sku, {
      message: 'Either productId, slug, or sku is required',
    }),

  LIST: z.object({
    ...PaginationSchema,
    ...SortingSchema,
    ...SearchSchema,
    tags: z.array(z.string().min(1).toLowerCase()).optional().describe('Filter by tags'),
    slugs: z.array(z.string().min(1)).optional().describe('Filter by product slugs'),
    includeDrafts: z.boolean().optional().describe('Include draft/unpublished products'),
  }),

  COUNT: z.object({
    ...SearchSchema,
    tags: z.array(z.string().min(1).toLowerCase()).optional().describe('Filter by tags'),
    slugs: z.array(z.string().min(1)).optional().describe('Filter by product slugs'),
    includeDrafts: z.boolean().optional().describe('Include draft/unpublished products'),
  }),

  UPDATE_STATUS: z.object({
    productId: z.string().min(1).describe('Product ID'),
    statusAction: z.enum(['PUBLISH', 'UNPUBLISH']).describe('Status action'),
  }),

  ADD_MEDIA: z.object({
    productId: z.string().min(1).describe('Product ID'),
    mediaName: z.string().min(1).describe('Media file name'),
    url: z.string().url().describe('Media URL'),
  }),

  REMOVE_MEDIA: z.object({
    productMediaId: z.string().min(1).describe('Product media ID'),
  }),

  REORDER_MEDIA: z.object({
    sortKeys: z
      .array(
        z.object({
          productMediaId: z.string().min(1).describe('Media asset ID'),
          sortKey: z.number().int().describe('New sort position'),
        }),
      )
      .nonempty()
      .describe('Sort keys'),
  }),

  GET_MEDIA: z.object({
    productId: z.string().min(1).describe('Product ID'),
    tags: z.array(z.string().min(1).toLowerCase()).optional().describe('Filter by tags'),
    ...PaginationSchema,
  }),

  UPDATE_MEDIA_TEXTS: z.object({
    productMediaId: z.string().min(1).describe('Product media ID'),
    mediaTexts: z.array(ProductMediaTextInputSchema).describe('Media texts'),
  }),

  CREATE_VARIATION: z.object({
    productId: z.string().min(1).describe('Product ID'),
    variation: z
      .object({
        key: z.string().min(1).describe('Unique variation key (e.g., "Color", "Size")'),
        type: z.enum(productVariationTypeKeys).describe('Variation type'),
      })
      .describe('Variation definition'),
    variationTexts: z.array(ProductVariationTextInputSchema).optional().describe('Variation texts'),
  }),

  REMOVE_VARIATION: z.object({
    productVariationId: z.string().min(1).describe('Product variation ID'),
  }),

  ADD_VARIATION_OPTION: z.object({
    productVariationId: z.string().min(1).describe('Product variation ID'),
    option: z.string().min(1).describe('Option value'),
    variationTexts: z.array(ProductVariationTextInputSchema).optional().describe('Variation texts'),
  }),

  REMOVE_VARIATION_OPTION: z.object({
    productVariationId: z.string().min(1).describe('Product variation ID'),
    productVariationOptionValue: z.string().min(1).describe('Option value'),
  }),

  UPDATE_VARIATION_TEXTS: z.object({
    productVariationId: z.string().min(1).describe('Product variation ID'),
    variationTexts: z.array(ProductVariationTextInputSchema).describe('Variation texts'),
    productVariationOptionValue: z.string().min(1).optional().describe('Option value'),
  }),

  GET_VARIATION_PRODUCTS: z.object({
    productId: z.string().min(1).describe('Product ID'),
    vectors: z.array(ProductAssignmentVectorSchema).describe('Variation vectors'),
    includeInactive: z.boolean().optional().default(true).describe('Include inactive products'),
  }),

  GET_ASSIGNMENTS: z.object({
    productId: z.string().min(1).describe('Product ID'),
    includeInactive: z.boolean().optional().describe('Include inactive assignments'),
  }),

  ADD_ASSIGNMENT: z.object({
    proxyId: z.string().min(1).describe('Proxy product ID'),
    assignProductId: z.string().min(1).describe('Product to assign'),
    vectors: z.array(ProductAssignmentVectorSchema).describe('Variation vectors'),
  }),

  REMOVE_ASSIGNMENT: z.object({
    proxyId: z.string().min(1).describe('Proxy product ID'),
    vectors: z.array(ProductAssignmentVectorSchema).describe('Variation vectors'),
  }),

  ADD_BUNDLE_ITEM: z.object({
    bundleId: z.string().min(1).describe('Bundle product ID'),
    bundleProductId: z.string().min(1).describe('Product to add to bundle'),
    quantity: z.number().int().positive().optional().describe('Quantity'),
  }),

  REMOVE_BUNDLE_ITEM: z.object({
    bundleId: z.string().min(1).describe('Bundle product ID'),
    index: z.number().int().min(0).describe('Bundle item index'),
  }),

  GET_BUNDLE_ITEMS: z.object({
    bundleId: z.string().min(1).describe('Bundle product ID'),
  }),

  GET_CATALOG_PRICE: z.object({
    productId: z.string().min(1).describe('Product ID'),
    quantity: z.number().int().positive().optional().describe('Quantity'),
    currencyCode: z.string().min(3).max(3).optional().describe('ISO currency code'),
  }),

  SIMULATE_PRICE: z.object({
    productId: z.string().min(1).describe('Product ID'),
    vectors: z.array(ProductAssignmentVectorSchema).optional().describe('Variation vectors'),
    quantity: z.number().int().positive().optional().describe('Quantity'),
    currencyCode: z.string().min(3).max(3).optional().describe('ISO currency code'),
    useNetPrice: z.boolean().optional().describe('Whether to use net price'),
  }),

  SIMULATE_PRICE_RANGE: z.object({
    productId: z.string().min(1).describe('Product ID'),
    vectors: z.array(ProductAssignmentVectorSchema).optional().describe('Variation vectors'),
    quantity: z.number().int().positive().optional().describe('Quantity'),
    currencyCode: z.string().min(3).max(3).optional().describe('ISO currency code'),
    useNetPrice: z.boolean().optional().describe('Whether to use net price'),
  }),

  GET_PRODUCT_TEXTS: z.object({
    productId: z.string().min(1).describe('Product ID'),
  }),

  GET_VARIATION_TEXTS: z.object({
    productVariationId: z.string().min(1).describe('Product variation ID'),
    productVariationOptionValue: z.string().min(1).optional().describe('Option value'),
  }),

  GET_MEDIA_TEXTS: z.object({
    productMediaId: z.string().min(1).describe('Product media ID'),
  }),

  GET_REVIEWS: z.object({
    productId: z.string().min(1).describe('Product ID'),
    ...PaginationSchema,
    ...SortingSchema,
    ...SearchSchema,
  }),

  COUNT_REVIEWS: z.object({
    productId: z.string().min(1).describe('Product ID'),
    ...SearchSchema,
  }),

  GET_SIBLINGS: z.object({
    productId: z.string().min(1).describe('Product ID'),
    assortmentId: z.string().optional().describe('Assortment ID'),
    includeInactive: z.boolean().optional().describe('Include inactive products'),
  }),
} as const;

export const ProductManagementSchema = {
  action: z
    .enum([
      'CREATE',
      'UPDATE',
      'REMOVE',
      'GET',
      'LIST',
      'COUNT',
      'UPDATE_STATUS',
      'ADD_MEDIA',
      'REMOVE_MEDIA',
      'REORDER_MEDIA',
      'GET_MEDIA',
      'UPDATE_MEDIA_TEXTS',
      'CREATE_VARIATION',
      'REMOVE_VARIATION',
      'ADD_VARIATION_OPTION',
      'REMOVE_VARIATION_OPTION',
      'ADD_ASSIGNMENT',
      'REMOVE_ASSIGNMENT',
      'GET_ASSIGNMENTS',
      'GET_VARIATION_PRODUCTS',
      'UPDATE_VARIATION_TEXTS',
      'ADD_BUNDLE_ITEM',
      'REMOVE_BUNDLE_ITEM',
      'GET_BUNDLE_ITEMS',
      'SIMULATE_PRICE',
      'SIMULATE_PRICE_RANGE',
      'GET_CATALOG_PRICE',
      'GET_PRODUCT_TEXTS',
      'GET_MEDIA_TEXTS',
      'GET_VARIATION_TEXTS',
      'GET_REVIEWS',
      'COUNT_REVIEWS',
      'GET_SIBLINGS',
    ])
    .describe('Product management action to perform'),

  productId: z
    .string()
    .min(1)
    .optional()
    .describe('Product ID (required for most actions except CREATE, LIST, COUNT)'),
  slug: z.string().optional().describe('Product slug (alternative to productId for GET action)'),
  sku: z.string().optional().describe('Product SKU (alternative to productId for GET action)'),
  productMediaId: z
    .string()
    .min(1)
    .optional()
    .describe('Product media ID (required for media-specific actions)'),
  productVariationId: z
    .string()
    .min(1)
    .optional()
    .describe('Product variation ID (required for variation-specific actions)'),

  product: ProductSchema.optional().describe('Product data object for CREATE/UPDATE actions'),
  texts: z
    .array(ProductTextInputSchema)
    .optional()
    .describe('Localized product text entries for CREATE action'),

  statusAction: z
    .enum(['PUBLISH', 'UNPUBLISH'])
    .optional()
    .describe('Status action for UPDATE_STATUS action'),

  mediaName: z.string().min(1).optional().describe('Media file name for ADD_MEDIA action'),
  url: z.string().url().optional().describe('Media URL for ADD_MEDIA action'),
  sortKeys: z
    .array(
      z.object({
        productMediaId: z.string().min(1).describe('Media asset ID'),
        sortKey: z.number().int().describe('New sort position'),
      }),
    )
    .optional()
    .describe('Sort keys for REORDER_MEDIA action'),
  mediaTexts: z
    .array(ProductMediaTextInputSchema)
    .optional()
    .describe('Media text updates for UPDATE_MEDIA_TEXTS action'),
  tags: z.array(z.string()).optional().describe('Media tags filter for GET_MEDIA action'),

  variation: z
    .object({
      key: z.string().min(1).describe('Unique variation key (e.g., "Color", "Size")'),
      type: z.enum(productVariationTypeKeys).describe('Variation type from ProductVariationType enum'),
    })
    .optional()
    .describe('Variation definition for CREATE_VARIATION action'),
  option: z
    .string()
    .min(1)
    .optional()
    .describe('Option value for ADD_VARIATION_OPTION action (e.g., "Red", "Large")'),
  productVariationOptionValue: z
    .string()
    .min(1)
    .optional()
    .describe('Option value for REMOVE_VARIATION_OPTION action'),
  variationTexts: z
    .array(ProductVariationTextInputSchema)
    .optional()
    .describe('Variation text updates for UPDATE_VARIATION_TEXTS action'),

  assignProductId: z
    .string()
    .min(1)
    .optional()
    .describe('Product to assign (ADD_ASSIGNMENT/REMOVE_ASSIGNMENT actions)'),
  proxyId: z.string().min(1).optional().describe('CONFIGURABLE_PRODUCT ID for assignments'),
  vectors: z
    .array(ProductAssignmentVectorSchema)
    .optional()
    .describe('Complete variation combination vectors'),
  includeInactive: z.boolean().optional().describe('Include inactive variants in results'),

  bundleId: z
    .string()
    .min(1)
    .optional()
    .describe('Bundle product ID for ADD_BUNDLE_ITEM/REMOVE_BUNDLE_ITEM actions'),
  bundleProductId: z
    .string()
    .min(1)
    .optional()
    .describe('Product to add to bundle for ADD_BUNDLE_ITEM action'),
  index: z.number().int().min(0).optional().describe('Bundle item index for REMOVE_BUNDLE_ITEM action'),

  quantity: z.number().int().positive().optional().describe('Quantity for pricing calculations'),
  currencyCode: z.string().min(3).max(3).optional().describe('ISO currency code for pricing'),
  useNetPrice: z.boolean().optional().describe('Whether to use net price in calculations'),

  ...PaginationSchema,
  ...SortingSchema,
  ...SearchSchema,
  includeDrafts: z.boolean().optional().describe('Include draft products in results'),
  productIds: z.array(z.string()).optional().describe('Filter by specific product IDs'),
  assortmentId: z.string().optional().describe('Filter by assortment ID (for GET_SIBLINGS action)'),
};

export const ProductManagementZodSchema = z.object(ProductManagementSchema);
export type ProductManagementParams = z.infer<typeof ProductManagementZodSchema>;

export type ActionName = keyof typeof actionValidators;
export type Params<T extends ActionName> = z.infer<(typeof actionValidators)[T]>;
export type Handler<T extends ActionName> = (productModule: any, params: Params<T>) => Promise<unknown>;
