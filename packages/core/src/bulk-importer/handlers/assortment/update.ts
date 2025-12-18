import { z } from 'zod';
import upsertAssortmentProducts, { AssortmentProductSchema } from './upsertAssortmentProducts.ts';
import upsertAssortmentChildren, { AssortmentLinkSchema } from './upsertAssortmentChildren.ts';
import upsertAssortmentFilters, { AssortmentFilterSchema } from './upsertAssortmentFilters.ts';
import upsertMedia, { MediaSchema } from './upsertMedia.ts';
import convertTagsToLowerCase from '../utils/convertTagsToLowerCase.ts';
import createAssortment, { AssortmentCreatePayloadSchema } from './create.ts';
import type { Modules } from '../../../modules.ts';
import type { Services } from '../../../services/index.ts';

export const AssortmentUpdatePayloadSchema = z.object({
  _id: z.string(),
  specification: z
    .object({
      isActive: z.boolean().optional(),
      isRoot: z.boolean().optional(),
      sequence: z.number().optional(),
      tags: z.array(z.string()).optional(),
      meta: z.record(z.any(), z.any()).optional(),
      content: z
        .record(
          z.string(), // locale
          z.object({
            title: z.string().optional(),
            subtitle: z.string().optional(),
            slug: z.string().optional(),
          }),
        )
        .optional(),
    })
    .optional(),
  media: z.array(MediaSchema).optional(),
  products: z.array(AssortmentProductSchema).optional(),
  children: z.array(AssortmentLinkSchema).optional(),
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
    if (updateShouldUpsertIfIDNotExists && specification) {
      return createAssortment(
        {
          _id,
          specification,
          media,
          products,
          children,
          filters,
        } as z.infer<typeof AssortmentCreatePayloadSchema>,
        { logger, createShouldUpsertIfIDExists },
        unchainedAPI,
      );
    }
    throw new Error(`Can't update non-existing assortment ${_id}`);
  }

  if (specification) {
    logger.debug('update assortment object', specification);

    if (specification.tags) {
      specification.tags = convertTagsToLowerCase(specification.tags!)!;
    }

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

updateAssortment.payloadSchema = AssortmentUpdatePayloadSchema;
