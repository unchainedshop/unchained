import { Context } from '@unchainedshop/types/api';
import { FilterText } from '@unchainedshop/types/filters';

export default async function upsertFilterOptionContent(
  { options, filter },
  { authorId },
  unchainedAPI: Context,
) {
  return Promise.all(
    (options || []).map(async ({ content: optionContent, value: optionValue }) => {
      await Promise.all(
        Object.entries(optionContent).map(async ([locale, localizedData]: [string, FilterText]) => {
          return unchainedAPI.modules.filters.texts.upsertLocalizedText(
            { filterId: filter._id, filterOptionValue: optionValue },
            locale,
            {
              ...localizedData,
              authorId,
            },
            unchainedAPI.userId,
          );
        }),
      );
    }),
  );
}
