import { AssortmentLinks } from 'meteor/unchained:core-assortments';

const upsert = async ({ _id, ...entityData }) => {
  try {
    return AssortmentLinks.createAssortmentLink(
      { _id, ...entityData },
      { skipInvalidation: true }
    );
  } catch (e) {
    AssortmentLinks.update({ _id }, { $set: entityData });
    return AssortmentLinks.findOne({ _id });
  }
};

export default async ({
  children,
  authorId,
  assortmentId: parentAssortmentId,
}) => {
  const assortmentLinkIds = await Promise.all(
    children.map(
      async ({ assortmentId: childAssortmentId, ...childrenRest }) => {
        const assortmentLink = await upsert({
          ...childrenRest,
          authorId,
          parentAssortmentId,
          childAssortmentId,
        });
        return assortmentLink._id;
      }
    )
  );
  AssortmentLinks.removeLinks(
    {
      _id: { $nin: assortmentLinkIds },
      parentAssortmentId,
    },
    { skipInvalidation: true }
  );
};
