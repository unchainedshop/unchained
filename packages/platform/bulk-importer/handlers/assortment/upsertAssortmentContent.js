import { Assortments } from 'meteor/unchained:core-assortments';

export default async ({ assortmentId, content, authorId }) => {
  const assortment = Assortments.findAssortment({ assortmentId });
  await Promise.all(
    Object.entries(content).map(async ([locale, localizedData]) => {
      return assortment.upsertLocalizedText(locale, {
        ...localizedData,
        authorId,
      });
    })
  );
};
