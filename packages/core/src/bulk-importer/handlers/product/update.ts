import { z } from 'zod';
import { Modules } from '../../../modules.js';
import { Services } from '../../../services/index.js';
import upsertVariations, { ProductVariationSchema } from './upsertVariations.js';
import upsertMedia, { MediaSchema } from './upsertMedia.js';
import createProduct, { ProductCreatePayloadSchema } from './create.js';
import convertTagsToLowerCase from '../utils/convertTagsToLowerCase.js';

export const ProductUpdateSpecificationSchema = z.object({
  type: z.string().optional(),
  sequence: z.number().optional(),
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
  content: z
    .record(
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
    )
    .optional(),
  variationResolvers: z
    .array(
      z.object({
        vector: z.record(z.string()),
        productId: z.string(),
      }),
    )
    .optional(),
});

export const ProductUpdatePayloadSchema = z.object({
  _id: z.string(),
  specification: ProductUpdateSpecificationSchema.optional(),
  media: z.array(MediaSchema).optional(),
  variations: z.array(ProductVariationSchema).optional(),
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
