import { z } from 'zod';

// Base schemas for common structures
const ContentSchema = z.record(
  z.string(),
  z.object({
    title: z.string().optional(),
    subtitle: z.string().optional(),
    description: z.string().optional(),
    vendor: z.string().optional(),
    brand: z.string().optional(),
    slug: z.string().optional(),
    labels: z.array(z.string()).optional(),
  }),
);

const AssetSchema = z.object({
  _id: z.string().nullable().optional(),
  fileName: z.string(),
  url: z.string().url(),
});

const MediaSchema = z.object({
  _id: z.string().nullable().optional(),
  asset: AssetSchema,
  tags: z.array(z.string()).default([]),
  meta: z.record(z.any()).default({}),
  content: ContentSchema.optional(),
});

// Product-specific schemas
const ProductPricingSchema = z.object({
  isTaxable: z.boolean(),
  isNetPrice: z.boolean(),
  countryCode: z.string().length(2),
  currencyCode: z.string().length(3),
  amount: z.number().int().positive(),
});

const ProductCommerceSchema = z.object({
  salesUnit: z.string(),
  salesQuantityPerUnit: z.string(),
  defaultOrderQuantity: z.string(),
  pricing: z.array(ProductPricingSchema),
});

const ProductWarehousingSchema = z.object({
  baseUnit: z.string(),
  dimensions: z.object({
    weightInGram: z.number().min(0),
    heightInMillimeters: z.number().min(0),
    lengthInMillimeters: z.number().min(0),
    widthInMillimeters: z.number().min(0),
  }),
});

const VariationResolverSchema = z.object({
  vector: z.record(z.string()),
  productId: z.string(),
});

const ProductPlanSchema = z.object({
  billingInterval: z.enum(['DAYS', 'WEEKS', 'MONTHS', 'YEARS']),
  billingIntervalCount: z.number().int().positive(),
  usageCalculationType: z.enum(['METERED', 'LICENSED']),
  trialInterval: z.enum(['DAYS', 'WEEKS', 'MONTHS', 'YEARS']).optional(),
  trialIntervalCount: z.number().int().positive().optional(),
});

const BundleItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().positive(),
  configuration: z.array(
    z.object({
      key: z.string(),
      value: z.string(),
    }),
  ).optional(),
});

const VariationOptionSchema = z.object({
  value: z.string(),
  content: ContentSchema,
});

const VariationSchema = z.object({
  key: z.string(),
  type: z.enum(['COLOR', 'TEXT']),
  options: z.array(VariationOptionSchema),
  content: ContentSchema,
});

const ProductSpecificationSchema = z.object({
  tags: z.array(z.string()).default([]),
  type: z.enum(['SimpleProduct', 'ConfigurableProduct', 'BundleProduct', 'PlanProduct']),
  published: z.string().datetime().optional(),
  commerce: ProductCommerceSchema.optional(),
  warehousing: ProductWarehousingSchema.optional(),
  variationResolvers: z.array(VariationResolverSchema).optional(),
  plan: ProductPlanSchema.optional(),
  bundleItems: z.array(BundleItemSchema).optional(),
  meta: z.record(z.any()).default({}),
  content: ContentSchema,
});

const ProductPayloadSchema = z.object({
  _id: z.string(),
  specification: ProductSpecificationSchema,
  media: z.array(MediaSchema).optional(),
  variations: z.array(VariationSchema).optional(),
});

// Filter-specific schemas
const FilterOptionSchema = z.object({
  value: z.string(),
  content: ContentSchema,
});

const FilterSpecificationSchema = z.object({
  key: z.string(),
  isActive: z.boolean(),
  type: z.enum(['SINGLE_CHOICE', 'MULTI_CHOICE', 'RANGE']),
  options: z.array(FilterOptionSchema),
  content: ContentSchema,
  meta: z.record(z.any()).default({}),
});

const FilterPayloadSchema = z.object({
  _id: z.string(),
  specification: FilterSpecificationSchema,
});

// Assortment-specific schemas
const AssortmentProductSchema = z.object({
  _id: z.string().optional(),
  productId: z.string(),
  tags: z.array(z.string()).default([]),
  meta: z.record(z.any()).default({}),
});

const AssortmentChildSchema = z.object({
  _id: z.string().optional(),
  assortmentId: z.string(),
  tags: z.array(z.string()).default([]),
  meta: z.record(z.any()).default({}),
});

const AssortmentFilterSchema = z.object({
  _id: z.string().optional(),
  filterId: z.string(),
  tags: z.array(z.string()).default([]),
  meta: z.record(z.any()).default({}),
});

const AssortmentSpecificationSchema = z.object({
  isActive: z.boolean(),
  isBase: z.boolean().optional(),
  isRoot: z.boolean().optional(),
  tags: z.array(z.string()).default([]),
  meta: z.record(z.any()).default({}),
  content: ContentSchema,
});

const AssortmentPayloadSchema = z.object({
  _id: z.string(),
  specification: AssortmentSpecificationSchema,
  products: z.array(AssortmentProductSchema).optional(),
  children: z.array(AssortmentChildSchema).optional(),
  filters: z.array(AssortmentFilterSchema).optional(),
  media: z.array(MediaSchema).optional(),
});

// Remove operation payloads (only need _id)
const RemovePayloadSchema = z.object({
  _id: z.string(),
});

// Entity-specific operation schemas
const ProductOperationSchema = z.discriminatedUnion('operation', [
  z.object({
    operation: z.literal('create'),
    payload: ProductPayloadSchema,
  }),
  z.object({
    operation: z.literal('update'),
    payload: ProductPayloadSchema.partial().extend({ _id: z.string() }),
  }),
  z.object({
    operation: z.literal('remove'),
    payload: RemovePayloadSchema,
  }),
]);

const FilterOperationSchema = z.discriminatedUnion('operation', [
  z.object({
    operation: z.literal('create'),
    payload: FilterPayloadSchema,
  }),
  z.object({
    operation: z.literal('update'),
    payload: FilterPayloadSchema.partial().extend({ _id: z.string() }),
  }),
  z.object({
    operation: z.literal('remove'),
    payload: RemovePayloadSchema,
  }),
]);

const AssortmentOperationSchema = z.discriminatedUnion('operation', [
  z.object({
    operation: z.literal('create'),
    payload: AssortmentPayloadSchema,
  }),
  z.object({
    operation: z.literal('update'),
    payload: AssortmentPayloadSchema.partial().extend({ _id: z.string() }),
  }),
  z.object({
    operation: z.literal('remove'),
    payload: RemovePayloadSchema,
  }),
]);

// Main event schema
export const BulkImportEventSchema = z.discriminatedUnion('entity', [
  z.object({
    entity: z.literal('PRODUCT'),
    ...ProductOperationSchema.shape,
  }),
  z.object({
    entity: z.literal('FILTER'),
    ...FilterOperationSchema.shape,
  }),
  z.object({
    entity: z.literal('ASSORTMENT'),
    ...AssortmentOperationSchema.shape,
  }),
]);

// Schema for the complete bulk import payload
export const BulkImportPayloadSchema = z.object({
  events: z.array(BulkImportEventSchema).min(1, 'At least one event is required'),
});

export type BulkImportEvent = z.infer<typeof BulkImportEventSchema>;
export type BulkImportPayload = z.infer<typeof BulkImportPayloadSchema>;