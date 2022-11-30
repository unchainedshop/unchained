import { Context } from '@unchainedshop/types/api';
import { AssortmentText } from '@unchainedshop/types/assortments';

export default async ({ assortmentId, content }, { modules }: Context) => {
  await Promise.all(
    Object.entries(content).map(async ([locale, localizedData]: [string, AssortmentText]) => {
      return modules.assortments.texts.upsertLocalizedText(assortmentId, locale, localizedData);
    }),
  );
};
