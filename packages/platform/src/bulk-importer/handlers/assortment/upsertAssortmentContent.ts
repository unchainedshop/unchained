import { Context } from '@unchainedshop/types/api';
import { AssortmentText } from '@unchainedshop/types/assortments';

export default async ({ assortmentId, content, authorId }, { modules, userId }: Context) => {
  await Promise.all(
    Object.entries(content).map(
      async ([locale, { authorId: tAuthorId, ...localizedData }]: [string, AssortmentText]) => {
        return modules.assortments.texts.upsertLocalizedText(
          assortmentId,
          locale,
          localizedData,
          tAuthorId || authorId || userId,
        );
      },
    ),
  );
};
