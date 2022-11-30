import { Context } from '@unchainedshop/types/api';
import { ProductText } from '@unchainedshop/types/products';

export default async function upsertProductContent({ productId, content }, { modules }: Context) {
  await Promise.all(
    Object.entries(content).map(async ([locale, localizedData]: [string, ProductText]) => {
      return modules.products.texts.upsertLocalizedText(productId, locale, localizedData);
    }),
  );
}
