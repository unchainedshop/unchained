import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api';
import { InvalidIdError } from '../../../errors';

export default async function productCatalogPrices(
  root: Root,
  { productId }: { productId: string },
  { modules, userId }: Context,
) {
  log(`query productCatalogPrices ${productId}`, { userId });

  if (!productId) throw new InvalidIdError({ productId });

  const product = await modules.products.findProduct({ productId });
  if (!product) return null;

  return modules.products.prices.catalogPrices(product);
}
