import { IncomingMessage, OutgoingMessage } from 'http';
import DataLoader from 'dataloader';
import { systemLocale } from '@unchainedshop/utils';
import localePkg from 'locale';
import { UnchainedCore } from '@unchainedshop/types/core.js';
import { ProductStatus } from '@unchainedshop/core-products';
import { UnchainedLoaders } from '@unchainedshop/types/api.js';

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

const loaders = async (
  req: IncomingMessage,
  res: OutgoingMessage,
  unchainedAPI: UnchainedCore,
): Promise<UnchainedLoaders['loaders']> => {
  return {
    assortmentLoader: new DataLoader(async (queries) => {
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

      const filterFn =
        ({ assortmentId }) =>
        (text) =>
          text.assortmentId === assortmentId;

      return getFilteredQueries({ queries, texts, filterFn });
    }),

    assortmentMediaTextLoader: new DataLoader(async (queries) => {
      const assortmentMediaIds = [...new Set(queries.map((q) => q.assortmentMediaId).filter(Boolean))];

      const texts = await unchainedAPI.modules.assortments.media.texts.findMediaTexts(
        { assortmentMediaId: { $in: assortmentMediaIds } },
        {
          sort: {
            assortmentMediaId: 1,
          },
        },
      );

      const filterFn =
        ({ assortmentMediaId }) =>
        (text) =>
          text.assortmentMediaId === assortmentMediaId;

      return getFilteredQueries({ queries, texts, filterFn });
    }),

    assortmentMediasLoader: new DataLoader(async (queries) => {
      const assortmentId = [...new Set(queries.map((q) => q.assortmentId).filter(Boolean))];
      const assortmentMediaItems = await unchainedAPI.modules.assortments.media.findAssortmentMedias({
        assortmentId,
      });

      return queries.map((q) => {
        return assortmentMediaItems.filter((i) => {
          return i.assortmentId === q.assortmentId;
        });
      });
    }),

    assortmentLinkLoader: new DataLoader(async (queries) => {
      const parentAssortmentIds = [...new Set(queries.map((q) => q.parentAssortmentId).filter(Boolean))];

      const links = await unchainedAPI.modules.assortments.links.findLinks({
        parentAssortmentIds,
      });

      return queries.map(({ parentAssortmentId, childAssortmentId }) => {
        return links.find((link) => {
          if (link.parentAssortmentId !== parentAssortmentId) return false;
          if (childAssortmentId && link.childAssortmentId !== childAssortmentId) return false;
          return true;
        });
      });
    }),

    assortmentLinksLoader: new DataLoader(async (queries) => {
      const parentAssortmentIds = [
        ...new Set(queries.flatMap((q) => q.parentAssortmentId).filter(Boolean)),
      ];
      const assortmentIds = [...new Set(queries.flatMap((q) => q.assortmentId).filter(Boolean))];

      const linksByParentAssortmentId =
        parentAssortmentIds?.length &&
        (await unchainedAPI.modules.assortments.links.findLinks({
          parentAssortmentIds,
        }));
      const linksByAssortmentId =
        assortmentIds?.length &&
        (await unchainedAPI.modules.assortments.links.findLinks({
          assortmentIds,
        }));

      return queries.map(({ parentAssortmentId, assortmentId }) => {
        if (parentAssortmentId) {
          return linksByParentAssortmentId.filter(
            (link) => link.parentAssortmentId === parentAssortmentId,
          );
        }
        if (assortmentId) {
          return linksByAssortmentId.filter(
            (link) =>
              link.parentAssortmentId === assortmentId || link.childAssortmentId === assortmentId,
          );
        }
        return [];
      });
    }),

    assortmentProductLoader: new DataLoader(async (queries) => {
      const assortmentIds = [...new Set(queries.map((q) => q.assortmentId).filter(Boolean))];

      const assortmentProducts = await unchainedAPI.modules.assortments.products.findProducts({
        assortmentIds,
      });

      return queries.map(({ assortmentId, productId }) => {
        return assortmentProducts.find((assortmentProduct) => {
          if (assortmentProduct.assortmentId !== assortmentId) return false;
          if (assortmentProduct.productId !== productId) return false;
          return true;
        });
      });
    }),

    filterLoader: new DataLoader(async (queries) => {
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

      const filterFn =
        ({ filterId, filterOptionValue }) =>
        (text) =>
          text.filterId === filterId && text.filterOptionValue === filterOptionValue;

      return getFilteredQueries({ queries, texts, filterFn });
    }),

    productLoader: new DataLoader(async (queries) => {
      const productIds = [...new Set(queries.map((q) => q.productId).filter(Boolean))]; // you don't need lodash, _.unique my ass

      const products = await unchainedAPI.modules.products.findProducts({
        productIds,
        productSelector: {
          status: { $exists: true },
        },
      });

      return queries.map(({ productId }) => {
        return products.find((product) => {
          if (product._id !== productId) return false;
          return true;
        });
      });
    }),

    productLoaderBySKU: new DataLoader(async (queries) => {
      const skus = [...new Set(queries.map((q) => q.sku).filter(Boolean))]; // you don't need lodash, _.unique my ass

      const products = await unchainedAPI.modules.products.findProducts({
        productSelector: {
          'warehousing.sku': { $in: skus },
          status: { $exists: true },
        },
      });

      return queries.map(({ sku }) => {
        return products.find((product) => {
          if (product.warehousing?.sku !== sku) return false;
          return true;
        });
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

      const filterFn =
        ({ productId }) =>
        (text) =>
          text.productId === productId;

      return getFilteredQueries({ queries, texts, filterFn });
    }),

    productMediaTextLoader: new DataLoader(async (queries) => {
      const productMediaIds = [...new Set(queries.map((q) => q.productMediaId).filter(Boolean))];

      const texts = await unchainedAPI.modules.products.media.texts.findMediaTexts(
        { productMediaId: { $in: productMediaIds } },
        {
          sort: {
            productMediaId: 1,
          },
        },
      );

      const filterFn =
        ({ productMediaId }) =>
        (text) =>
          text.productMediaId === productMediaId;

      return getFilteredQueries({ queries, texts, filterFn });
    }),

    fileLoader: new DataLoader(async (queries) => {
      const fileIds = [...new Set(queries.map((q) => q.fileId).filter(Boolean))]; // you don't need lodash, _.unique my ass

      const files = await unchainedAPI.modules.files.findFiles({
        _id: { $in: fileIds },
      });

      return queries.map(({ fileId }) => {
        return files.find((file) => {
          if (file._id !== fileId) return false;
          return true;
        });
      });
    }),

    productMediasLoader: new DataLoader(async (queries) => {
      const productId = [...new Set(queries.map((q) => q.productId).filter(Boolean))];
      const productMediaItems = await unchainedAPI.modules.products.media.findProductMedias({
        productId,
      });

      return queries.map((q) => {
        return productMediaItems.filter((i) => {
          return i.productId === q.productId;
        });
      });
    }),
  };
};

export default loaders;
