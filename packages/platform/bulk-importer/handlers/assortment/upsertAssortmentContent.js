export default async ({ assortment, content, authorId }) => {
  await Promise.all(
    Object.entries(content).map(async ([locale, localizedData]) => {
      return assortment.upsertLocalizedText(locale, {
        ...localizedData,
        authorId,
      });
    })
  );
};
