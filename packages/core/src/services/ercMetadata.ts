import { WarehousingProviderType } from '@unchainedshop/core-warehousing';
import { WarehousingDirector } from '../directors/WarehousingDirector.js';
import { Modules } from '../modules.js';

export const ercMetadataService = async (
  { productId, chainTokenId, locale }: { productId: string; chainTokenId: string; locale: Intl.Locale },
  context: { modules: Modules },
) => {
  const product = await context.modules.products.findProduct({
    productId,
  });

  const [token] = await context.modules.warehousing.findTokens({
    chainTokenId,
    contractAddress: product?.tokenization?.contractAddress,
  });

  const virtualProviders = await context.modules.warehousing.findProviders({
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
    context,
  );
};
