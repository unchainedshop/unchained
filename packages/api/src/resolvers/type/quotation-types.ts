import { Quotation as QuotationType } from '@unchainedshop/core-quotations';
import { Context } from '../../context.js';

export const Quotation = {
  country: async (obj: QuotationType, _: never, { loaders }: Context) =>
    obj.countryCode ? loaders.countryLoader.load({ isoCode: obj.countryCode }) : null,

  currency: async (obj: QuotationType, _: never, { loaders }: Context) =>
    obj.currencyCode ? loaders.currencyLoader.load({ isoCode: obj.currencyCode }) : null,

  isExpired: (obj: QuotationType, { referenceDate }: { referenceDate: Date }, { modules }: Context) =>
    modules.quotations.isExpired(obj, { referenceDate }),

  product: async (obj: QuotationType, _: never, { loaders }: Context) => {
    const product = await loaders.productLoader.load({
      productId: obj.productId,
    });
    return product;
  },

  status: (obj: QuotationType, _: never, { modules }: Context) =>
    modules.quotations.normalizedStatus(obj),

  user: async (obj: QuotationType, _: never, { loaders }: Context) =>
    loaders.userLoader.load({ userId: obj.userId }),
};
