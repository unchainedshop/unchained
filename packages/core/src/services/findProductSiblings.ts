import type { Product } from '@unchainedshop/core-products';
import type { Modules } from '../modules.ts';

export async function findProductSiblingsService(
  this: Modules,
  {
    product,
    assortmentId,
    limit,
    offset,
    includeInactive = false,
  }: {
    product: Product;
    assortmentId?: string;
    limit?: number;
    offset?: number;
    includeInactive?: boolean;
  },
): Promise<Product[]> {
  const productId = product._id;

  const assortmentIds = assortmentId
    ? [assortmentId]
    : await this.assortments.products.findAssortmentIds({ productId });

  if (!assortmentIds.length) return [];

  const productIds = await this.assortments.products.findSiblings({
    productId,
    assortmentIds,
  });

  return this.products.findProducts({
    productIds,
    includeDrafts: includeInactive,
    limit,
    offset,
  });
}
