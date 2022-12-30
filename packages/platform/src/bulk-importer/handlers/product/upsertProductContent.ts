import { UnchainedCore } from '@unchainedshop/types/core.js';
import { ProductText } from '@unchainedshop/types/products.js';

export default async function upsertProductContent({ productId, content }, { modules }: UnchainedCore) {
  await Promise.all(
    Object.entries(content).map(async ([locale, localizedData]: [string, ProductText]) => {
      return modules.products.texts.upsertLocalizedText(productId, locale, localizedData);
    }),
  );
}
