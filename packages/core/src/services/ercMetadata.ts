import { WarehousingProviderType } from '@unchainedshop/core-warehousing';
import { WarehousingDirector } from '../directors/WarehousingDirector.js';
import { Modules } from '../modules.js';

export async function ercMetadataService(
  this: Modules,
  { productId, chainTokenId, locale }: { productId: string; chainTokenId: string; locale: Intl.Locale },
) {
  const product = await this.products.findProduct({
    productId,
  });

  const [token] = await this.warehousing.findTokens({
    chainTokenId,
    contractAddress: product?.tokenization?.contractAddress,
  });

  const virtualProviders = await this.warehousing.findProviders({
    type: WarehousingProviderType.VIRTUAL,
  });

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
