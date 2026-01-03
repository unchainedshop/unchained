import type { Modules } from '../modules.ts';
import { SearchDirector } from '../directors/index.ts';
import type { ProductQuery } from '@unchainedshop/core-products';
import type { SortOption } from '@unchainedshop/utils';

export async function searchProductsSimpleService(
  this: Modules,
  queryString?: string,
  query: ProductQuery & { limit?: number; offset?: number; sort?: SortOption[] } = {},
) {
  if (!queryString) {
    return this.products.findProducts(query);
  }

  const searchActions = SearchDirector.actions({ queryString }, { modules: this });
  const matchingIds = await searchActions.searchProducts();
  if (matchingIds.length === 0) return [];

  return this.products.findProducts({ ...query, searchProductIds: matchingIds });
}

export async function searchProductsSimpleCountService(
  this: Modules,
  queryString?: string,
  query: ProductQuery = {},
) {
  if (!queryString) {
    return this.products.count(query);
  }

  const searchActions = SearchDirector.actions({ queryString }, { modules: this });
  const matchingIds = await searchActions.searchProducts();
  if (matchingIds.length === 0) return 0;

  return this.products.count({ ...query, searchProductIds: matchingIds });
}
