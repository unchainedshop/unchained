import { z } from 'zod';
import { createLogger } from '@unchainedshop/logger';
import convertTagsToLowerCase from '../utils/convertTagsToLowerCase.ts';
import type { Modules } from '../../../modules.ts';

const logger = createLogger('unchained:bulk-importer');

export const AssortmentLinkSchema = z.object({
  _id: z.string().optional(),
  assortmentId: z.string(),
  tags: z.array(z.string()).optional(),
  sortKey: z.number().optional(),
  meta: z.record(z.any(), z.any()).optional(),
});

const upsert = async (
  assortmentLink: {
    _id?: string;
    parentAssortmentId: string;
    childAssortmentId: string;
    tags: string[];
    sortKey?: number;
  },
  { modules }: { modules: Modules },
) => {
  if (
    !(await modules.assortments.assortmentExists({
      assortmentId: assortmentLink.childAssortmentId,
    }))
  ) {
    throw new Error(`Can't link non-existing assortment ${assortmentLink.childAssortmentId}`);
  }

  // Check if the link already exists
  if (assortmentLink._id) {
    const existing = await modules.assortments.links.findLink({
      assortmentLinkId: assortmentLink._id,
    });
    if (existing) {
      const updated = await modules.assortments.links.update(assortmentLink._id, assortmentLink, {
        skipInvalidation: true,
      });
      if (!updated) {
        throw new Error(`Failed to update assortment link ${assortmentLink._id}`);
      }
      logger.debug(`Updated assortment link ${assortmentLink._id}`);
      return updated;
    }
  }

  const newAssortmentLink = await modules.assortments.links.create(assortmentLink, {
    skipInvalidation: true,
  });
  if (!newAssortmentLink) {
    throw new Error(`Failed to create assortment link`);
  }
  logger.debug(`Created assortment link ${newAssortmentLink._id}`);
  return newAssortmentLink;
};

export default async (
  {
    children,
    assortmentId: parentAssortmentId,
  }: {
    children: z.infer<typeof AssortmentLinkSchema>[];
    assortmentId: string;
  },
  unchainedAPI: { modules: Modules },
) => {
  const { modules } = unchainedAPI;
  const assortmentLinkIds = await Promise.all(
    children.map(
      async ({ assortmentId: childAssortmentId, sortKey, tags: tagsMixedCase }, sortKeyForced) => {
        const tags = tagsMixedCase ? convertTagsToLowerCase(tagsMixedCase)! : [];
        const assortmentLink = await upsert(
          {
            sortKey: sortKey ?? sortKeyForced,
            tags,
            parentAssortmentId,
            childAssortmentId,
          },
          unchainedAPI,
        );
        return assortmentLink._id;
      },
    ),
  );
  await modules.assortments.links.deleteMany(
    {
      excludeIds: assortmentLinkIds,
      parentAssortmentId,
    },
    { skipInvalidation: true },
  );
};
