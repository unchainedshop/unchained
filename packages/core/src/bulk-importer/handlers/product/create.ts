import { z } from 'zod/v4-mini';
import type { Modules } from '../../../modules.ts';
import type { Services } from '../../../services/index.ts';
import upsertVariations, { ProductVariationSchema } from './upsertVariations.ts';
import upsertMedia from './upsertMedia.ts';
import { MediaSchema } from '../assortment/upsertMedia.ts';
import convertTagsToLowerCase from '../utils/convertTagsToLowerCase.ts';
import { ProductType } from '@unchainedshop/core-products';

export const ProductCreateSpecificationSchema = z.object({
  type: z.enum(ProductType),
  sequence: z.optional(z.number()),
  status: z.nullish(z.string()), // or null!
  published: z.nullish(z.iso.datetime()), // or null!
  tags: z.optional(z.array(z.string())),
  commerce: z.optional(
    z.object({
      pricing: z.array(
        z.object({
          amount: z.number(),
          maxQuantity: z.optional(z.number()),
          isTaxable: z.optional(z.boolean()),
          isNetPrice: z.optional(z.boolean()),
          currencyCode: z.string().check(z.minLength(1, 'currencyCode is required')),
          countryCode: z.string().check(z.minLength(1, 'countryCode is required')),
        }),
      ),
    }),
  ),
  warehousing: z.optional(
    z.object({
      sku: z.optional(z.string()),
      baseUnit: z.optional(z.string()),
    }),
  ),
  supply: z.optional(
    z.object({
      weightInGram: z.optional(z.number()),
      heightInMillimeters: z.optional(z.number()),
      lengthInMillimeters: z.optional(z.number()),
      widthInMillimeters: z.optional(z.number()),
    }),
  ),
  bundleItems: z.optional(
    z.array(
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
    ),
  ),
  meta: z.optional(z.record(z.any(), z.any())),
  content: z.record(
    z.string(), // locale
    z.object({
      title: z.optional(z.string()),
      subtitle: z.optional(z.string()),
      slug: z.optional(z.string()),
      description: z.optional(z.string()),
      brand: z.optional(z.string()),
      vendor: z.optional(z.string()),
      labels: z.optional(z.array(z.string())),
    }),
  ),
  variationResolvers: z.optional(
    z.array(
      z.object({
        vector: z.record(z.string(), z.any()),
        productId: z.string(),
      }),
    ),
  ),
});

export const ProductCreatePayloadSchema = z.object({
  _id: z.string(),
  specification: ProductCreateSpecificationSchema,
  media: z.optional(z.array(MediaSchema)),
  variations: z.optional(z.array(ProductVariationSchema)),
});

const transformSpecification = (specification: z.infer<typeof ProductCreateSpecificationSchema>) => {
  const {
    variationResolvers: assignments,
    content, // eslint-disable-line
    supply,
    warehousing,
    sequence,
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
    ...(sequence != null && { sequence }),
  };
};

export default async function createProduct(
  payload: z.infer<typeof ProductCreatePayloadSchema>,
  { logger, createShouldUpsertIfIDExists },
  unchainedAPI: { modules: Modules; services: Services },
) {
  const { modules } = unchainedAPI;
  const { specification, media, variations, _id } = payload;

  const productData = transformSpecification(specification);
  logger.debug('create product object', productData);
  try {
    await modules.products.create({
      ...productData,
      _id,
    });
  } catch (e) {
    if (!createShouldUpsertIfIDExists) throw e;

    logger.debug('entity already exists, falling back to update', specification);
    await modules.products.update(_id, {
      ...productData,
    });
  }

  if (!(await modules.products.productExists({ productId: _id }))) {
    throw new Error(`Can't create product ${_id}`);
  }

  if (specification.content) {
    logger.debug('create localized content for product', specification.content);
    await modules.products.texts.updateTexts(
      _id,
      Object.entries(specification.content).map(([locale, localizedData]: [string, any]) => {
        return {
          locale,
          ...localizedData,
        };
      }),
    );
  }

  logger.debug('create product variations', variations);
  await upsertVariations(
    {
      variations: variations || [],
      productId: _id,
    },
    unchainedAPI,
  );

  logger.debug('create product media', media);
  await upsertMedia({ media: media || [], productId: _id }, unchainedAPI);

  return {
    entity: 'PRODUCT',
    operation: 'create',
    _id,
    success: true,
  };
}

createProduct.payloadSchema = ProductCreatePayloadSchema;
