export default async ({ content, filter }, { authorId }) => {
  return Promise.all(
    Object.entries(content).map(async ([locale, localizedData]) => {
      return filter.upsertLocalizedText(locale, {
        ...localizedData,
        authorId,
      });
    })
  );
};
