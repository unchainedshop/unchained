import { z } from 'zod';
import upsertAssortmentProducts, { AssortmentProductSchema } from './upsertAssortmentProducts.js';
import upsertAssortmentChildren, { AssortmentChildSchema } from './upsertAssortmentChildren.js';
import upsertAssortmentFilters, { AssortmentFilterSchema } from './upsertAssortmentFilters.js';
import upsertMedia, { MediaSchema } from './upsertMedia.js';
import convertTagsToLowerCase from '../utils/convertTagsToLowerCase.js';
import createAssortment from './create.js';
import { Modules } from '../../../modules.js';
import { Services } from '../../../services/index.js';
import { LocalizedContentSchema } from '../utils/event-schema.js';

export const AssortmentUpdatePayloadSchema = z.object({
  _id: z.string(),
  specification: z
    .object({
      isActive: z.boolean().optional(),
      isBase: z.boolean().optional(),
      isRoot: z.boolean().optional(),
      sequence: z.number(),
      tags: z.array(z.string()).optional(),
      meta: z.record(z.unknown()).optional(),
      content: LocalizedContentSchema,
    })
    .optional(),
  media: z.array(MediaSchema).optional(),
  products: z.array(AssortmentProductSchema).optional(),
  children: z.array(AssortmentChildSchema).optional(),
  filters: z.array(AssortmentFilterSchema).optional(),
});

export default async function updateAssortment(
  payload: z.infer<typeof AssortmentUpdatePayloadSchema>,
  { logger, createShouldUpsertIfIDExists, updateShouldUpsertIfIDNotExists },
  unchainedAPI: { modules: Modules; services: Services },
) {
  const { modules } = unchainedAPI;
  const { media, specification, products, children, filters, _id } = payload;

  if (!(await modules.assortments.assortmentExists({ assortmentId: _id }))) {
    if (updateShouldUpsertIfIDNotExists) {
      return createAssortment(payload, { logger, createShouldUpsertIfIDExists }, unchainedAPI);
    }
    throw new Error(`Can't update non-existing assortment ${_id}`);
  }

  if (specification) {
    logger.debug('update assortment object', specification);

    specification.tags = convertTagsToLowerCase(specification?.tags);

    await unchainedAPI.modules.assortments.update(_id, { ...specification });

    if (specification.content) {
      logger.debug('replace localized content for assortment', specification.content);
      await modules.assortments.texts.updateTexts(
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

  if (products) {
    logger.debug('update product products', products);
    await upsertAssortmentProducts(
      {
        products: products || [],
        assortmentId: _id,
      },
      unchainedAPI,
    );
  }

  if (children) {
    logger.debug('update assortment children', children);
    await upsertAssortmentChildren(
      {
        children: children || [],
        assortmentId: _id,
      },
      unchainedAPI,
    );
  }

  if (filters) {
    logger.debug('update assortment filters', filters);
    await upsertAssortmentFilters(
      {
        filters: filters || [],
        assortmentId: _id,
      },
      unchainedAPI,
    );
  }
  if (media) {
    logger.debug('update assortment media', media);
    await upsertMedia({ media: media || [], assortmentId: _id }, unchainedAPI);
  }

  return {
    entity: 'ASSORTMENT',
    operation: 'update',
    _id,
    success: true,
  };
}
