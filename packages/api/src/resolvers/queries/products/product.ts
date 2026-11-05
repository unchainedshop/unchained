import type { Context } from '../../../context.ts';
import { log } from '@unchainedshop/logger';
import { type Product, productsSettings } from '@unchainedshop/core-products';
import { InvalidIdError } from '../../../errors.ts';
import { actions } from '../../../roles/index.ts';

// With options.products.hideDrafts, drafts and deleted products only reach callers who may also
// list drafts (viewProducts with includeDrafts). Everyone else gets null, as for an unknown product,
// so an unpublished product cannot be read by its slug or id.
export const isProductVisible = async (product: Product, context: Context): Promise<boolean> => {
  if (!productsSettings.hideDrafts || context.modules.products.isActive(product)) return true;
  return context.roles!.userHasPermission(context, actions.viewProducts, [
    undefined,
    { includeDrafts: true },
  ]);
};

export default async function product(
  root: never,
  { productId, slug }: { productId?: string; slug?: string },
  context: Context,
) {
  const { modules, userId } = context;
  log(`query product ${productId || slug}`, { userId });

  if (!productId === !slug) throw new InvalidIdError({ productId, slug });

  const foundProduct = await modules.products.findProduct({ productId, slug: slug! });
  if (!foundProduct || !(await isProductVisible(foundProduct, context))) return null;
  return foundProduct;
}
