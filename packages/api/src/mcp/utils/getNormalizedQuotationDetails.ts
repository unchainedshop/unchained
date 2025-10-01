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

  const avatar = await loaders.fileLoader.load({
    fileId: user?.avatarId,
  });

  return {
    ...quotation,
    status: modules.quotations.normalizedStatus(quotation),
    user: {
      ...removeConfidentialServiceHashes(user),
      avatar: await normalizeMediaUrl([{ mediaId: avatar?._id }], context),
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
