import { Context } from '@unchainedshop/types/api';
import { AssortmentLink } from '@unchainedshop/types/assortments';

const upsert = async (
  assortmentLink: AssortmentLink,
  { modules, userId }: Context
) => {
  if (
    !(await modules.assortments.assortmentExists({
      assortmentId: assortmentLink.childAssortmentId,
    }))
  ) {
    throw new Error(
      `Can't link non-existing assortment ${assortmentLink.childAssortmentId}`
    );
  }
  try {
    return await modules.assortments.links.create(
      assortmentLink,
      { skipInvalidation: true },
      userId
    );
  } catch (e) {
    return await modules.assortments.links.update(
      assortmentLink._id,
      assortmentLink
    );
  }
};

export default async (
  { children, authorId, assortmentId: parentAssortmentId },
  unchainedAPI: Context
) => {
  const { modules, userId } = unchainedAPI;
  const assortmentLinkIds = await Promise.all(
    children.map(
      async ({ assortmentId: childAssortmentId, ...childrenRest }) => {
        const assortmentLink = await upsert(
          {
            ...childrenRest,
            authorId,
            parentAssortmentId,
            childAssortmentId,
          } as AssortmentLink,
          unchainedAPI
        );
        return assortmentLink._id;
      }
    )
  );
  await modules.assortments.links.deleteMany(
    {
      _id: { $nin: assortmentLinkIds },
      parentAssortmentId,
    },
    { skipInvalidation: true },
    userId
  );
};
