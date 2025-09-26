import { z } from 'zod';
import { AssortmentLink } from '@unchainedshop/core-assortments';
import convertTagsToLowerCase from '../utils/convertTagsToLowerCase.js';
import { Modules } from '../../../modules.js';

export const AssortmentLinkSchema = z.object({
  _id: z.string().optional(),
  parentAssortmentId: z.string(),
  childAssortmentId: z.string(),
  tags: z.array(z.string()),
  sortKey: z.number(),
});

const upsert = async (
  assortmentLink: z.infer<typeof AssortmentLinkSchema>,
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
  { children, assortmentId: parentAssortmentId },
  unchainedAPI: { modules: Modules },
) => {
  const { modules } = unchainedAPI;
  const assortmentLinkIds = await Promise.all(
    children.map(async ({ assortmentId: childAssortmentId, ...childrenRest }) => {
      const tags = convertTagsToLowerCase(childrenRest?.tags);
      const assortmentLink = await upsert(
        {
          ...childrenRest,
          tags,
          parentAssortmentId,
          childAssortmentId,
        } as AssortmentLink,
        unchainedAPI,
      );
      return assortmentLink._id;
    }),
  );
  await modules.assortments.links.deleteMany(
    {
      _id: { $nin: assortmentLinkIds },
      parentAssortmentId,
    },
    { skipInvalidation: true },
  );
};
