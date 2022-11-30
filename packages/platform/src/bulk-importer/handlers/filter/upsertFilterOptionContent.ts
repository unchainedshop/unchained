import { UnchainedCore } from '@unchainedshop/types/core';
import { FilterText } from '@unchainedshop/types/filters';

export default async function upsertFilterOptionContent(
  { options, filterId },
  unchainedAPI: UnchainedCore,
) {
  return Promise.all(
    (options || []).map(async ({ content: optionContent, value: optionValue }) => {
      await Promise.all(
        Object.entries(optionContent).map(async ([locale, localizedData]: [string, FilterText]) => {
          return unchainedAPI.modules.filters.texts.upsertLocalizedText(
            { filterId, filterOptionValue: optionValue },
            locale,
            localizedData,
          );
        }),
      );
    }),
  );
}
