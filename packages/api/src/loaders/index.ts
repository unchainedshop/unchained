import { IncomingMessage, OutgoingMessage } from 'http';
import { UnchainedLoaders } from '@unchainedshop/types/api.js';
import DataLoader from 'dataloader';
import { systemLocale } from '@unchainedshop/utils';
import localePkg from 'locale';
import { Assortment, AssortmentText } from '@unchainedshop/types/assortments.js';
import { Filter, FilterText } from '@unchainedshop/types/filters.js';
import { Product, ProductText } from '@unchainedshop/types/products.js';
import { UnchainedCore } from '@unchainedshop/types/core.js';
import { ProductStatus } from '@unchainedshop/core-products';

const { Locale } = localePkg;

function getLocaleStrings(localeObj) {
  return [localeObj.normalized, localeObj.language, systemLocale.normalized, systemLocale.language];
}

function findMatchingText(texts, localeStrings) {
  return localeStrings.reduce((acc, localeString) => {
    if (acc) return acc;
    return texts.find((p) => p.locale === localeString);
  }, null);
}

function getFilteredQueries({ queries, texts, filterFn }) {
  return queries.map(({ locale, ...queryParams }) => {
    const localeObj = new Locale(locale);

    const filteredTexts = texts.filter(filterFn(queryParams));
    if (!filteredTexts.length) return null;

    const localeStrings = getLocaleStrings(localeObj);
    const filterText = findMatchingText(filteredTexts, localeStrings);
    return filterText || filteredTexts[0];
  });
}

export default async (
  req: IncomingMessage,
  res: OutgoingMessage,
  unchainedAPI: UnchainedCore,
): Promise<UnchainedLoaders['loaders']> => {
  return {
    assortmentLoader: new DataLoader<{ assortmentId: string }, Assortment>(async (queries) => {
      const assortmentIds = [...new Set(queries.map((q) => q.assortmentId).filter(Boolean))];

      const assortments = await unchainedAPI.modules.assortments.findAssortments({
        assortmentIds,
        includeInactive: true,
        includeLeaves: true,
      });

      return queries.map(({ assortmentId }) => {
        return assortments.find((assortment) => {
          if (assortment._id !== assortmentId) return false;
          return true;
        });
      });
    }),

    assortmentTextLoader: new DataLoader<{ assortmentId: string; locale: string }, AssortmentText>(
      async (queries) => {
        const assortmentIds = [...new Set(queries.map((q) => q.assortmentId).filter(Boolean))];

        const texts = await unchainedAPI.modules.assortments.texts.findTexts(
          { assortmentId: { $in: assortmentIds } },
          {
            sort: {
              assortmentId: 1,
            },
          },
        );

        const filterFn =
          ({ assortmentId }) =>
          (text) =>
            text.assortmentId === assortmentId;

        return getFilteredQueries({ queries, texts, filterFn });
      },
    ),

    filterLoader: new DataLoader<{ filterId: string }, Filter>(async (queries) => {
      const filterIds = [...new Set(queries.map((q) => q.filterId).filter(Boolean))];

      const filters = await unchainedAPI.modules.filters.findFilters({
        filterIds,
        includeInactive: true,
      });

      return queries.map(({ filterId }) => {
        return filters.find((product) => {
          if (product._id !== filterId) return false;
          return true;
        });
      });
    }),

    filterTextLoader: new DataLoader<
      { filterId: string; filterOptionValue?: string; locale: string },
      FilterText
    >(async (queries) => {
      const filterIds = [...new Set(queries.map((q) => q.filterId).filter(Boolean))];

      const texts = await unchainedAPI.modules.filters.texts.findTexts(
        { filterId: { $in: filterIds } },
        {
          sort: {
            filterId: 1,
          },
        },
      );

      const filterFn =
        ({ filterId, filterOptionValue }) =>
        (text) =>
          text.filterId === filterId && text.filterOptionValue === filterOptionValue;

      return getFilteredQueries({ queries, texts, filterFn });
    }),

    productLoader: new DataLoader<{ productId: string }, Product>(async (queries) => {
      const productIds = [...new Set(queries.map((q) => q.productId).filter(Boolean))]; // you don't need lodash, _.unique my ass

      const products = await unchainedAPI.modules.products.findProducts({
        productIds,
        productSelector: {
          status: { $in: [null, ProductStatus.ACTIVE, ProductStatus.DELETED] },
        },
      });

      return queries.map(({ productId }) => {
        return products.find((product) => {
          if (product._id !== productId) return false;
          return true;
        });
      });
    }),

    productTextLoader: new DataLoader<{ productId: string; locale: string }, ProductText>(
      async (queries) => {
        const productIds = [...new Set(queries.map((q) => q.productId).filter(Boolean))];

        const texts = await unchainedAPI.modules.products.texts.findTexts(
          { productId: { $in: productIds } },
          {
            sort: {
              productId: 1,
            },
          },
        );

        const filterFn =
          ({ productId }) =>
          (text) =>
            text.productId === productId;

        return getFilteredQueries({ queries, texts, filterFn });
      },
    ),
  };
};
