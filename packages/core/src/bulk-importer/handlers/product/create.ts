import { z } from 'zod';
import type { Modules } from '../../../modules.ts';
import type { Services } from '../../../services/index.ts';
import upsertVariations, { ProductVariationSchema } from './upsertVariations.ts';
import upsertMedia from './upsertMedia.ts';
import { MediaSchema } from '../assortment/upsertMedia.ts';
import convertTagsToLowerCase from '../utils/convertTagsToLowerCase.ts';
import { ProductType } from '@unchainedshop/core-products';

export const ProductCreateSpecificationSchema = z.object({
  type: z.enum(ProductType),
  sequence: z.number(),
  status: z.string().optional().nullable(), // or null!
  published: z.string().datetime().optional().nullable(), // or null!
  tags: z.array(z.string()).optional(),
  commerce: z
    .object({
      pricing: z.array(
        z.object({
          amount: z.number(),
          minQuantity: z.number().optional(),
          isTaxable: z.boolean().optional(),
          isNetPrice: z.boolean().optional(),
          currencyCode: z.string().min(1, 'currencyCode is required'),
          countryCode: z.string().min(1, 'countryCode is required'),
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
  meta: z.record(z.any(), z.any()).optional(),
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
        vector: z.record(z.string(), z.any()),
        productId: z.string(),
      }),
    )
    .optional(),
});

export const ProductCreatePayloadSchema = z.object({
  _id: z.string(),
  specification: ProductCreateSpecificationSchema,
  media: z.array(MediaSchema).optional(),
  variations: z.array(ProductVariationSchema).optional(),
});

const transformSpecification = (specification: z.infer<typeof ProductCreateSpecificationSchema>) => {
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
