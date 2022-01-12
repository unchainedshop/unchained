import { Context } from '@unchainedshop/types/api';
import { Filter, FilterText } from '@unchainedshop/types/filters';

export default async function upsertFilterContent(
  { content, filter },
  { authorId },
  unchainedAPI: Context
) {
  return Promise.all(
    Object.entries(content).map(
      async ([locale, localizedData]: [string, FilterText]) => {
        return await unchainedAPI.modules.filters.texts.upsertLocalizedText(
          { filterId: filter._id },
          locale,
          {
            ...localizedData,
            authorId,
          },
          unchainedAPI.userId
        );
      }
    )
  );
}
