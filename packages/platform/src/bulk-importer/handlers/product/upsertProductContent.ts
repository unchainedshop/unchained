import { Context } from '@unchainedshop/types/api';
import { ProductText } from '@unchainedshop/types/products';

export default async function upsertProductContent(
  { productId, content, authorId },
  { modules, userId }: Context,
) {
  await Promise.all(
    Object.entries(content).map(
      async ([locale, { authorId: tAuthorId, ...localizedData }]: [string, ProductText]) => {
        return modules.products.texts.upsertLocalizedText(
          productId,
          locale,
          localizedData,
          tAuthorId || authorId || userId,
        );
      },
    ),
  );
}
