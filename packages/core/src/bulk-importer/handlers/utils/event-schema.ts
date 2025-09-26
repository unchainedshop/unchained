import { z } from 'zod';
import { AssetSchema } from '../../upsertAsset.js';

// Base localized content schema
export const LocalizedContentSchema = z.record(
  z.string(), // locale
  z.object({
    title: z.string().optional(),
    subtitle: z.string().optional(),
    slug: z.string().optional(),
    description: z.string().optional(),
    labels: z.array(z.string()).optional(),
  }),
);

// Media asset schema

// Media schema shared between products and assortments
const MediaSchema = z.object({
  _id: z.string().optional(),
  asset: AssetSchema,
  content: LocalizedContentSchema.optional(),
  tags: z.array(z.string()).optional(),
  sortKey: z.number().optional(),
});

// Product-specific schemas
const ProductVariationOptionSchema = z.object({
  value: z.string(),
  content: LocalizedContentSchema.optional(),
});

const ProductVariationSchema = z.object({
  _id: z.string().optional(),
  key: z.string(),
  type: z.string(),
  options: z.array(ProductVariationOptionSchema),
  content: LocalizedContentSchema.optional(),
});

const ProductSpecificationSchema = z.object({
  type: z.string(),
  sequence: z.string(),
  status: z.string().optional(),
  published: z.string().datetime().optional(),
  tags: z.array(z.string()).optional(),
  commerce: z
    .object({
      pricing: z
        .array(
          z.object({
            amount: z.number(),
            maxQuantity: z.number().optional(),
            isTaxable: z.boolean().optional(),
            isNetPrice: z.boolean().optional(),
            currencyCode: z.string(),
            countryCode: z.string(),
          }),
        )
        .optional(),
    })
    .optional(),
  warehousing: z
    .object({
      sku: z.string().optional(),
      baseUnit: z.string().optional(),
      dimensions: z
        .object({
          weight: z.number().optional(),
          length: z.number().optional(),
          width: z.number().optional(),
          height: z.number().optional(),
        })
        .optional(),
    })
    .optional(),
  bundleItems: z
    .array(
      z.object({
        productId: z.string(),
        quantity: z.number(),
        configuration: z
          .array(
            z.object({
              key: z.string(),
              value: z.string(),
            }),
          )
          .optional(),
      }),
    )
    .optional(),
  meta: z.record(z.unknown()).optional(),
  content: LocalizedContentSchema,
  variationResolvers: z
    .array(
      z.object({
        vector: z.record(z.string()),
        productId: z.string(),
      }),
    )
    .optional(),
});

// Assortment-specific schemas

// Filter-specific schemas
const FilterOptionSchema = z.object({
  value: z.string(),
  content: LocalizedContentSchema.optional(),
});

const FilterSpecificationSchema = z.object({
  type: z.string(),
  key: z.string(),
  isActive: z.boolean().optional(),
  options: z.array(FilterOptionSchema).optional(),
  meta: z.record(z.unknown()).optional(),
  content: LocalizedContentSchema,
});

// Event payload schemas
const ProductCreatePayloadSchema = z.object({
  _id: z.string(),
  specification: ProductSpecificationSchema,
  media: z.array(MediaSchema).optional(),
  variations: z.array(ProductVariationSchema).optional(),
});

const ProductUpdatePayloadSchema = z.object({
  _id: z.string(),
  specification: ProductSpecificationSchema.optional(),
  media: z.array(MediaSchema).optional(),
  variations: z.array(ProductVariationSchema).optional(),
});

const ProductRemovePayloadSchema = z.object({
  _id: z.string(),
});

const FilterCreatePayloadSchema = z.object({
  _id: z.string(),
  specification: FilterSpecificationSchema,
});

const FilterUpdatePayloadSchema = z.object({
  _id: z.string(),
  specification: FilterSpecificationSchema.optional(),
});

const FilterRemovePayloadSchema = z.object({
  _id: z.string(),
});

// Main event schema with discriminated union
// export const BulkImporterEventSchema = z.discriminatedUnion('entity', [
//   // Product events
//   z.object({
//     entity: z.literal('product'),
//     operation: z.literal('create'),
//     payload: ProductCreatePayloadSchema,
//   }),
//   z.object({
//     entity: z.literal('product'),
//     operation: z.literal('update'),
//     payload: ProductUpdatePayloadSchema,
//   }),
//   z.object({
//     entity: z.literal('product'),
//     operation: z.literal('remove'),
//     payload: ProductRemovePayloadSchema,
//   }),
//   // Assortment events

//   // Filter events
//   z.object({
//     entity: z.literal('filter'),
//     operation: z.literal('create'),
//     payload: FilterCreatePayloadSchema,
//   }),
//   z.object({
//     entity: z.literal('filter'),
//     operation: z.literal('update'),
//     payload: FilterUpdatePayloadSchema,
//   }),
//   z.object({
//     entity: z.literal('filter'),
//     operation: z.literal('remove'),
//     payload: FilterRemovePayloadSchema,
//   }),
// ]);

// Type inference
// export type BulkImporterEvent = z.infer<typeof BulkImporterEventSchema>;
