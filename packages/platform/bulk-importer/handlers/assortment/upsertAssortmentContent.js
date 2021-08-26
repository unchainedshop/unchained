import { Assortments } from 'meteor/unchained:core-assortments';

export default async ({ assortmentId, content, authorId }) => {
  const assortment = await Assortments.findAssortment({ assortmentId });
  if (!assortment)
    throw new Error(
      `Can't update content of non-existing assortment ${assortmentId}`
    );

  await Promise.all(
    Object.entries(content).map(async ([locale, localizedData]) => {
      return assortment.upsertLocalizedText(locale, {
        ...localizedData,
        authorId,
      });
    })
  );
};
