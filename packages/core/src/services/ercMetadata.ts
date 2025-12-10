import { type TokenSurrogate, WarehousingProviderType } from '@unchainedshop/core-warehousing';
import type { Product } from '@unchainedshop/core-products';
import { WarehousingDirector } from '../directors/WarehousingDirector.ts';
import type { Modules } from '../modules.ts';

export async function ercMetadataService(
  this: Modules,
  { product, token, locale }: { product: Product; token: TokenSurrogate; locale: Intl.Locale },
) {
  const virtualProviders = (await this.warehousing.allProviders()).filter(
    ({ type }) => type === WarehousingProviderType.VIRTUAL,
  );

  return await WarehousingDirector.tokenMetadata(
    virtualProviders,
    {
      product,
      token,
      locale,
      quantity: token?.quantity || 1,
      referenceDate: new Date(),
    },
    { modules: this },
  );
}
