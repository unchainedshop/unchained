import { log } from '@unchainedshop/logger';
import type { Context } from '../../../context.ts';
import { InvalidIdError } from '../../../errors.ts';
import { isProductVisible } from './product.ts';

export default async function productCatalogPrices(
  root: never,
  { productId }: { productId: string },
  context: Context,
) {
  const { modules, loaders, userId } = context;
  log(`query productCatalogPrices ${productId}`, { userId });

  if (!productId) throw new InvalidIdError({ productId });

  const product = await loaders.productLoader.load({
    productId,
  });
  if (!product || !(await isProductVisible(product, context))) return null;

  return modules.products.prices.catalogPrices(product);
}
