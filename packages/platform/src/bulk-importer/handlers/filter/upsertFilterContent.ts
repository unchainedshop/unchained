import { UnchainedCore } from '@unchainedshop/types/core.js';
import { FilterText } from '@unchainedshop/types/filters.js';

export default async function upsertFilterContent({ content, filterId }, unchainedAPI: UnchainedCore) {
  return Promise.all(
    Object.entries(content).map(async ([locale, localizedData]: [string, FilterText]) => {
      return unchainedAPI.modules.filters.texts.upsertLocalizedText({ filterId }, locale, localizedData);
    }),
  );
}
