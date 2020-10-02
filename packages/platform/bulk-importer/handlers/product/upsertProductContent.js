export default async ({ product, content, authorId }) => {
  await Promise.all(
    Object.entries(content).map(async ([locale, localizedData]) => {
      return product.upsertLocalizedText(locale, {
        ...localizedData,
        authorId,
      });
    })
  );
};
