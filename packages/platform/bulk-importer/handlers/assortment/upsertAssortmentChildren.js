import { AssortmentLinks } from 'meteor/unchained:core-assortments';

export default async ({
  children,
  authorId,
  assortmentId: parentAssortmentId,
}) => {
  return Promise.all(
    children.map(
      async ({ assortmentId: childAssortmentId, ...childrenRest }) => {
        const assortmentLink = await AssortmentLinks.createAssortmentLink({
          ...childrenRest,
          authorId,
          parentAssortmentId,
          childAssortmentId,
        });
        return assortmentLink;
      }
    )
  );
};
