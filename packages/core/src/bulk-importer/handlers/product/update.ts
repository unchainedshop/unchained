import { z } from 'zod/v4-mini';
import type { Modules } from '../../../modules.ts';
import type { Services } from '../../../services/index.ts';
import upsertVariations, { ProductVariationSchema } from './upsertVariations.ts';
import upsertMedia, { MediaSchema } from './upsertMedia.ts';
import createProduct, {
  ProductContentSchema,
  ProductCreatePayloadSchema,
  ProductSpecificationFields,
} from './create.ts';
import convertTagsToLowerCase from '../utils/convertTagsToLowerCase.ts';
import { ProductStatus, type ProductTokenization } from '@unchainedshop/core-products';

export const ProductUpdateSpecificationSchema = z.object({
  ...ProductSpecificationFields,
  type: z.optional(z.string()),
  content: z.optional(ProductContentSchema),
});

export const ProductUpdatePayloadSchema = z.object({
  _id: z.string(),
  specification: z.optional(ProductUpdateSpecificationSchema),
  media: z.optional(z.array(MediaSchema)),
  variations: z.optional(z.array(ProductVariationSchema)),
});

/* See create.ts: draft is null in the database, not the string form of the enum. */
const normalizeStatus = (status?: string | null) => (status === ProductStatus.DRAFT ? null : status);

const transformSpecification = (specification: z.infer<typeof ProductUpdateSpecificationSchema>) => {
  const {
    variationResolvers: assignments,
    content, // eslint-disable-line
    supply,
    warehousing,
    tokenization,
    ...productData
  } = specification;

  const tags = productData?.tags ? convertTagsToLowerCase(productData.tags!)! : [];
  const proxy = assignments ? { assignments } : undefined;

  return {
    ...productData,
    published: productData.published ? new Date(productData.published) : undefined,
    ...(productData.status !== undefined && { status: normalizeStatus(productData.status) }),
    ...(tokenization !== undefined && { tokenization: tokenization as ProductTokenization }),
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
