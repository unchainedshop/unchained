import { z } from 'zod';
import { Modules } from '../../../modules.js';
import { Services } from '../../../services/index.js';
import upsertVariations, { ProductVariationSchema } from './upsertVariations.js';
import upsertMedia from './upsertMedia.js';
import transformSpecificationToProductStructure, {
  ProductSpecificationSchema,
} from './transformSpecificationToProductStructure.js';
import { MediaSchema } from '../assortment/upsertMedia.js';

export const ProductCreatePayloadSchema = z.object({
  _id: z.string(),
  specification: ProductSpecificationSchema,
  media: z.array(MediaSchema).optional(),
  variations: z.array(ProductVariationSchema).optional(),
});

export default async function createProduct(
  payload: z.infer<typeof ProductCreatePayloadSchema>,
  { logger, createShouldUpsertIfIDExists },
  unchainedAPI: { modules: Modules; services: Services },
) {
  const { modules } = unchainedAPI;
  const { specification, media, variations, _id } = payload;

  const productData = transformSpecificationToProductStructure(specification);
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
