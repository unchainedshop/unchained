import { Context } from '@unchainedshop/types/api';
import { ProductText } from '@unchainedshop/types/products';

export default async function upsertProductContent(
  { productId, content, authorId },
  { modules, userId }: Context
) {
  const product = await modules.products.findProduct({ productId });
  if (!product)
    throw new Error(
      `Can't update content of non-existing product ${productId}`
    );

  await Promise.all(
    Object.entries(content).map(
      async ([locale, localizedData]: [string, ProductText]) => {
        return modules.products.texts.upsertLocalizedText(
          productId,
          locale,
          {
            ...localizedData,
            authorId,
          },
          userId
        );
      }
    )
  );
}
