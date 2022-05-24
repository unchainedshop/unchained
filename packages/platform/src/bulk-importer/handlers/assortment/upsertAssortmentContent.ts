import { Context } from '@unchainedshop/types/api';
import { AssortmentText } from '@unchainedshop/types/assortments';

export default async ({ assortmentId, content, authorId }, { modules, userId }: Context) => {
  const assortment = await modules.assortments.findAssortment({ assortmentId });
  if (!assortment) throw new Error(`Can't update content of non-existing assortment ${assortmentId}`);

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
