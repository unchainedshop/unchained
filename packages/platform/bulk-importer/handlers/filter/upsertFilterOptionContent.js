export default async ({ options, filter }, { authorId }) => {
  if (!filter)
    throw new Error(
      `Can't update option content of non-existing filter ${filter._id}`
    );

  return Promise.all(
    (options || []).map(
      async ({ content: optionContent, value: optionValue }) => {
        await Promise.all(
          Object.entries(optionContent).map(async ([locale, localizedData]) => {
            return filter.upsertLocalizedText(locale, {
              ...localizedData,
              filterOptionValue: optionValue,
              authorId,
            });
          })
        );
      }
    )
  );
};
