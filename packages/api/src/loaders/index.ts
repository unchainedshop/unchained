import { UnchainedAPI, UnchainedLoaders } from '@unchainedshop/types/api';
import DataLoader from 'dataloader';
import { IncomingMessage } from 'http';
import { systemLocale } from 'meteor/unchained:utils';
import { Locale } from 'locale';

export default async (req: IncomingMessage, unchainedAPI: UnchainedAPI): Promise<UnchainedLoaders> => {
  return {
    bookmarksByQueryLoader: new DataLoader(async (queries) => {
      const results = await unchainedAPI.modules.bookmarks.find({
        $or: queries,
      });
      return queries.map(
        (key: any) =>
          results.find((result) => result.userId === key.userId && result.productId === key.productId) ||
          null,
      );
    }),
    bookmarkByIdLoader: new DataLoader(async (ids) => {
      const results = await unchainedAPI.modules.bookmarks.find({
        _id: {
          $in: ids,
        },
      });
      return ids.map((key) => results.find((result) => result._id === key) || null);
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
