import type { TokenSurrogate } from '@unchainedshop/core-warehousing';
import { WarehousingProviderType } from '@unchainedshop/core-warehousing';
import type { Product } from '@unchainedshop/core-products';
import type { Modules } from '../modules.ts';
import { WarehousingDirector } from '../directors/WarehousingDirector.ts';

export async function isTokenInvalidateableService(
  this: Modules,
  {
    token,
    product: providedProduct,
  }: {
    token: TokenSurrogate;
    product?: Product;
  },
): Promise<boolean> {
  const product = providedProduct || (await this.products.findProduct({ productId: token.productId }));
  if (!product) return false;

  const virtualProviders = (await this.warehousing.allProviders()).filter(
    ({ type }) => type === WarehousingProviderType.VIRTUAL,
  );

  const isInvalidateable = await WarehousingDirector.isInvalidateable(
    virtualProviders,
    {
      token,
      product,
      quantity: token?.quantity || 1,
      referenceDate: new Date(),
    },
    { modules: this },
  );

  return !!isInvalidateable;
}
