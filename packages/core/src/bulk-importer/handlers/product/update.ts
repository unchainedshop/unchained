import { z } from 'zod';
import { Modules } from '../../../modules.js';
import { Services } from '../../../services/index.js';
import upsertVariations, { ProductVariationSchema } from './upsertVariations.js';
import upsertMedia, { MediaSchema } from './upsertMedia.js';
import transformSpecificationToProductStructure, {
  ProductSpecificationSchema,
} from './transformSpecificationToProductStructure.js';
import createProduct, { ProductCreatePayloadSchema } from './create.js';

export const ProductUpdatePayloadSchema = z.object({
  _id: z.string(),
  specification: ProductSpecificationSchema.optional(),
  media: z.array(MediaSchema).optional(),
  variations: z.array(ProductVariationSchema).optional(),
});

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
    const productData = transformSpecificationToProductStructure(specification);
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
