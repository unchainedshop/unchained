export default async ({ options, filter }, { authorId }) => {
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
