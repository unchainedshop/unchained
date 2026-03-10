import { type TokenSurrogate, WarehousingProviderType } from '@unchainedshop/core-warehousing';
import { WarehousingDirector } from '../directors/WarehousingDirector.ts';
import type { Modules } from '../modules.ts';

export async function onTokenInvalidatedService(
  this: Modules,
  {
    token,
  }: {
    token: TokenSurrogate;
  },
): Promise<any> {
  const product = await this.products.findProduct({ productId: token.productId });
  if (!product) return null;

  const virtualProviders = (await this.warehousing.allProviders()).filter(
    ({ type }) => type === WarehousingProviderType.VIRTUAL,
  );

  return WarehousingDirector.tokenMetadata(
    virtualProviders,
    {
      token,
      product,
      quantity: token?.quantity || 1,
      referenceDate: new Date(),
    },
    { modules: this },
  );
}
