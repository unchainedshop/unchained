import { z } from 'zod/v4-mini';
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
  specification: z.optional(
    z.object({
      isActive: z.optional(z.boolean()),
      isRoot: z.optional(z.boolean()),
      sequence: z.optional(z.number()),
      tags: z.optional(z.array(z.string())),
      meta: z.optional(z.record(z.any(), z.any())),
      content: z.optional(
        z.record(
          z.string(), // locale
          z.object({
            title: z.optional(z.string()),
            subtitle: z.optional(z.string()),
            slug: z.optional(z.string()),
          }),
        ),
      ),
    }),
  ),
  media: z.optional(z.array(MediaSchema)),
  products: z.optional(z.array(AssortmentProductSchema)),
  children: z.optional(z.array(AssortmentLinkSchema)),
  filters: z.optional(z.array(AssortmentFilterSchema)),
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
