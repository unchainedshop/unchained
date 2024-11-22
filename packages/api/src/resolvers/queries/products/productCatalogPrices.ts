import { log } from '@unchainedshop/logger';
import { Context } from '../../../context.js';
import { InvalidIdError } from '../../../errors.js';

export default async function productCatalogPrices(
  root: never,
  { productId }: { productId: string },
  { modules, loaders, userId }: Context,
) {
  log(`query productCatalogPrices ${productId}`, { userId });

  if (!productId) throw new InvalidIdError({ productId });

  const product = await loaders.productLoader.load({
    productId,
  });
  if (!product) return null;

  return modules.products.prices.catalogPrices(product);
}
