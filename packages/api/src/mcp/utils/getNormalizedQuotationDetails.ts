import { removeConfidentialServiceHashes } from '@unchainedshop/core-users';
import { Context } from '../../context.js';
import normalizeMediaUrl from './normalizeMediaUrl.js';

export async function getNormalizedQuotationDetails(quotationId: string, context: Context) {
  const { modules, loaders, locale } = context;

  const quotation = await modules.quotations.findQuotation({ quotationId });

  if (!quotation) return null;
  const [user, product, productText, country, currency] = await Promise.all([
    loaders.userLoader.load({ userId: quotation.userId }),
    loaders.productLoader.load({ productId: quotation.productId }),
    loaders.productTextLoader.load({
      productId: quotation.productId,
      locale,
    }),
    quotation.countryCode ? loaders.countryLoader.load({ isoCode: quotation.countryCode }) : null,
    quotation.currencyCode ? loaders.currencyLoader.load({ isoCode: quotation.currencyCode }) : null,
  ]);

  return {
    ...quotation,
    status: modules.quotations.normalizedStatus(quotation),
    user: {
      ...removeConfidentialServiceHashes(user),
      avatar: user?.avatarId ? await normalizeMediaUrl([{ mediaId: user?.avatarId }], context) : null,
    },
    product: product
      ? {
          ...product,
          texts: productText,
        }
      : null,
    country,
    currency,
  };
}
