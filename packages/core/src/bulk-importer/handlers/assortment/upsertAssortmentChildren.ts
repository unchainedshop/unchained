import { z } from 'zod/v4-mini';
import convertTagsToLowerCase from '../utils/convertTagsToLowerCase.ts';
import type { Modules } from '../../../modules.ts';

export const AssortmentLinkSchema = z.object({
  _id: z.optional(z.string()),
  assortmentId: z.string(),
  tags: z.optional(z.array(z.string())),
  sortKey: z.optional(z.number()),
  meta: z.optional(z.record(z.any(), z.any())),
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
  try {
    const newAssortmentLink = await modules.assortments.links.create(assortmentLink, {
      skipInvalidation: true,
    });
    return newAssortmentLink!;
  } catch {
    return (await modules.assortments.links.update(assortmentLink._id!, assortmentLink, {
      skipInvalidation: true,
    }))!;
  }
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
      _id: { $nin: assortmentLinkIds },
      parentAssortmentId,
    },
    { skipInvalidation: true },
  );
};
