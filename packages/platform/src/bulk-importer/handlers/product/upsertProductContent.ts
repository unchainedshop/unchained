import { UnchainedCore } from '@unchainedshop/types/core';
import { ProductText } from '@unchainedshop/types/products';

export default async function upsertProductContent({ productId, content }, { modules }: UnchainedCore) {
  await Promise.all(
    Object.entries(content).map(async ([locale, localizedData]: [string, ProductText]) => {
      return modules.products.texts.upsertLocalizedText(productId, locale, localizedData);
    }),
  );
}
