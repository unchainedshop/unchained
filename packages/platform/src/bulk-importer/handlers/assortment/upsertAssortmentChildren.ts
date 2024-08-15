import { AssortmentLink } from '@unchainedshop/core-assortments';
import { UnchainedCore } from '@unchainedshop/core';
import convertTagsToLowerCase from '../utils/convertTagsToLowerCase.js';

const upsert = async (assortmentLink: AssortmentLink, { modules }: UnchainedCore) => {
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
    return newAssortmentLink;
  } catch {
    return modules.assortments.links.update(assortmentLink._id, assortmentLink, {
      skipInvalidation: true,
    });
  }
};

export default async ({ children, assortmentId: parentAssortmentId }, unchainedAPI: UnchainedCore) => {
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
