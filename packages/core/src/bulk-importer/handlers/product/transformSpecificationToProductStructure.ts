import { z } from 'zod';
import convertTagsToLowerCase from '../utils/convertTagsToLowerCase.js';

export const ProductSpecificationSchema = z.object({
  type: z.string(),
  sequence: z.number(),
  status: z.string().optional().nullable(), // or null!
  published: z.string().datetime().optional().nullable(), // or null!
  tags: z.array(z.string()).optional(),
  commerce: z
    .object({
      pricing: z.array(
        z.object({
          amount: z.number(),
          maxQuantity: z.number().optional(),
          isTaxable: z.boolean().optional(),
          isNetPrice: z.boolean().optional(),
          currencyCode: z.string(),
          countryCode: z.string(),
        }),
      ),
    })
    .optional(),
  warehousing: z
    .object({
      sku: z.string().optional(),
      baseUnit: z.string().optional(),
    })
    .optional(),
  supply: z
    .object({
      weightInGram: z.number().optional(),
      heightInMillimeters: z.number().optional(),
      lengthInMillimeters: z.number().optional(),
      widthInMillimeters: z.number().optional(),
    })
    .optional(),
  bundleItems: z
    .array(
      z.object({
        productId: z.string(),
        quantity: z.number(),
        configuration: z.array(
          z.object({
            key: z.string(),
            value: z.string(),
          }),
        ),
      }),
    )
    .optional(),
  meta: z.record(z.unknown()).optional(),
  content: z.record(
    z.string(), // locale
    z.object({
      title: z.string().optional(),
      subtitle: z.string().optional(),
      slug: z.string().optional(),
      description: z.string().optional(),
      brand: z.string().optional(),
      vendor: z.string().optional(),
      labels: z.array(z.string()).optional(),
    }),
  ),
  variationResolvers: z
    .array(
      z.object({
        vector: z.record(z.string()),
        productId: z.string(),
      }),
    )
    .optional(),
});

export default (specification: z.infer<typeof ProductSpecificationSchema>) => {
  const {
    variationResolvers: assignments,
    content, // eslint-disable-line
    supply,
    warehousing,
    ...productData
  } = specification;

  const tags = productData?.tags ? convertTagsToLowerCase(productData.tags!)! : [];
  const proxy = assignments ? { assignments } : undefined;

  return {
    ...productData,
    published: productData.published ? new Date(productData.published) : undefined,
    tags,
    warehousing,
    supply,
    proxy,
  };
};
