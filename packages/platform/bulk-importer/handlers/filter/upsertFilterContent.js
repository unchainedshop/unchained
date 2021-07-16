export default async ({ content, filter }, { authorId }) => {
  if (!filter)
    throw new Error(
      `Can't update content of non-existing filter ${filter._id}`
    );

  return Promise.all(
    Object.entries(content).map(async ([locale, localizedData]) => {
      return filter.upsertLocalizedText(locale, {
        ...localizedData,
        authorId,
      });
    })
  );
};
