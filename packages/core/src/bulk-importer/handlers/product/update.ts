import { z } from 'zod/v4-mini';
import type { Modules } from '../../../modules.ts';
import type { Services } from '../../../services/index.ts';
import upsertVariations, { ProductVariationSchema } from './upsertVariations.ts';
import upsertMedia, { MediaSchema } from './upsertMedia.ts';
import createProduct, { ProductCreatePayloadSchema } from './create.ts';
import convertTagsToLowerCase from '../utils/convertTagsToLowerCase.ts';

export const ProductUpdateSpecificationSchema = z.object({
  type: z.optional(z.string()),
  sequence: z.optional(z.number()),
  status: z.nullable(z.optional(z.string())), // or null!
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
  content: z.optional(
    z.record(
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

export const ProductUpdatePayloadSchema = z.object({
  _id: z.string(),
  specification: z.optional(ProductUpdateSpecificationSchema),
  media: z.optional(z.array(MediaSchema)),
  variations: z.optional(z.array(ProductVariationSchema)),
});

const transformSpecification = (specification: z.infer<typeof ProductUpdateSpecificationSchema>) => {
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

export default async function updateProduct(
  payload: z.infer<typeof ProductUpdatePayloadSchema>,
  { logger, updateShouldUpsertIfIDNotExists },
  unchainedAPI: { modules: Modules; services: Services },
) {
  const { modules } = unchainedAPI;
  const { specification, media, variations, _id } = payload;

  if (!(await modules.products.productExists({ productId: _id }))) {
    if (updateShouldUpsertIfIDNotExists && payload.specification) {
      return createProduct(
        payload as z.infer<typeof ProductCreatePayloadSchema>,
        { logger, createShouldUpsertIfIDExists: false },
        unchainedAPI,
      );
    }
    throw new Error(`Can't update non-existing product ${_id}`);
  }

  if (specification) {
    const productData = transformSpecification(specification);
    logger.debug('update product object', productData);
    await modules.products.update(_id, {
      ...productData,
    });

    if (specification.content) {
      logger.debug('replace localized content for product', specification.content);
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
  }

  if (variations) {
    logger.debug('replace variations', variations);
    await upsertVariations(
      {
        variations: variations || [],
        productId: _id,
      },
      unchainedAPI,
    );
  }

  if (media) {
    logger.debug('replace product media', media);
    await upsertMedia({ media, productId: _id }, unchainedAPI);
  }

  return {
    entity: 'PRODUCT',
    operation: 'update',
    _id,
    success: true,
  };
}

updateProduct.payloadSchema = ProductUpdatePayloadSchema;
