import { AssortmentText } from '@unchainedshop/types/assortments';
import { UnchainedCore } from '@unchainedshop/types/core';

export default async ({ assortmentId, content }, { modules }: UnchainedCore) => {
  await Promise.all(
    Object.entries(content).map(async ([locale, localizedData]: [string, AssortmentText]) => {
      return modules.assortments.texts.upsertLocalizedText(assortmentId, locale, localizedData);
    }),
  );
};
