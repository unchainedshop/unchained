import { UnchainedAPI, UnchainedLoaders } from '@unchainedshop/types/api';
import DataLoader from 'dataloader';
import { IncomingMessage } from 'http';
import { systemLocale } from 'meteor/unchained:utils';
import { Locale } from 'locale';

export default async (
  req: IncomingMessage,
  unchainedAPI: UnchainedAPI,
): Promise<UnchainedLoaders['loaders']> => {
  return {
    assortmentTextLoader: new DataLoader(async (queries) => {
      const assortmentIds = [...new Set(queries.map((q) => q.assortmentId).filter(Boolean))];

      const texts = await unchainedAPI.modules.assortments.texts.findTexts(
        { assortmentId: { $in: assortmentIds } },
        {
          sort: {
            assortmentId: 1,
          },
        },
      );

      const systemLocaleStrings = [systemLocale.normalized, systemLocale.language];

      return queries.map(({ assortmentId, locale }) => {
        const localeObj = new Locale(locale);
        const assortmentTexts = texts.filter((text) => text.assortmentId === assortmentId);
        if (!assortmentTexts.length) return null;
        const localeStrings = [localeObj.normalized, localeObj.language, ...systemLocaleStrings];

        const assortmentText = localeStrings.reduce((acc, localeString) => {
          if (acc) return acc;
          return assortmentTexts.find((p) => p.locale === localeString);
        }, null);
        return assortmentText || assortmentTexts[0];
      });
    }),

    filterTextLoader: new DataLoader(async (queries) => {
      const filterIds = [...new Set(queries.map((q) => q.filterId).filter(Boolean))];

      const texts = await unchainedAPI.modules.filters.texts.findTexts(
        { filterId: { $in: filterIds } },
        {
          sort: {
            filterId: 1,
          },
        },
      );

      const systemLocaleStrings = [systemLocale.normalized, systemLocale.language];

      return queries.map(({ filterId, filterOptionValue, locale }) => {
        const localeObj = new Locale(locale);
        const filterTexts = texts.filter(
          (text) => text.filterId === filterId && text.filterOptionValue === filterOptionValue,
        );
        if (!filterTexts.length) return null;
        const localeStrings = [localeObj.normalized, localeObj.language, ...systemLocaleStrings];

        const filterText = localeStrings.reduce((acc, localeString) => {
          if (acc) return acc;
          return filterTexts.find((p) => p.locale === localeString);
        }, null);
        return filterText || filterTexts[0];
      });
    }),

    productTextLoader: new DataLoader(async (queries) => {
      const productIds = [...new Set(queries.map((q) => q.productId).filter(Boolean))];

      const texts = await unchainedAPI.modules.products.texts.findTexts(
        { productId: { $in: productIds } },
        {
          sort: {
            productId: 1,
          },
        },
      );

      const systemLocaleStrings = [systemLocale.normalized, systemLocale.language];

      return queries.map(({ productId, locale }) => {
        const localeObj = new Locale(locale);
        const productTexts = texts.filter((text) => text.productId === productId);
        if (!productTexts.length) return null;
        const localeStrings = [localeObj.normalized, localeObj.language, ...systemLocaleStrings];

        const productText = localeStrings.reduce((acc, localeString) => {
          if (acc) return acc;
          return productTexts.find((p) => p.locale === localeString);
        }, null);
        return productText || productTexts[0];
      });
    }),
  };
};
