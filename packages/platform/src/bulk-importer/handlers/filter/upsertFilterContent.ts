import { Context } from '@unchainedshop/types/api';
import { FilterText } from '@unchainedshop/types/filters';

export default async function upsertFilterContent(
  { content, filterId, authorId },
  unchainedAPI: Context,
) {
  return Promise.all(
    Object.entries(content).map(
      async ([locale, { authorId: tAuthorId, ...localizedData }]: [string, FilterText]) => {
        return unchainedAPI.modules.filters.texts.upsertLocalizedText(
          { filterId },
          locale,
          localizedData,
          tAuthorId || authorId || unchainedAPI.userId,
        );
      },
    ),
  );
}
