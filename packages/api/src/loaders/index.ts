import DataLoader from 'dataloader';
import { systemLocale } from '@unchainedshop/utils';
import { UnchainedCore } from '@unchainedshop/core';
import { Product, ProductText, ProductMediaText, ProductMedia } from '@unchainedshop/core-products';
import { Filter, FilterText } from '@unchainedshop/core-filters';
import {
  Assortment,
  AssortmentLink,
  AssortmentProduct,
  AssortmentText,
  AssortmentMediaType,
  AssortmentMediaText,
} from '@unchainedshop/core-assortments';
import { File } from '@unchainedshop/core-files';

export interface UnchainedLoaders {
  loaders: {
    productLoader: InstanceType<typeof DataLoader<{ productId: string }, Product>>;
    productLoaderBySKU: InstanceType<typeof DataLoader<{ sku: string }, Product>>;
    productTextLoader: InstanceType<
      typeof DataLoader<{ productId: string; locale: string }, ProductText>
    >;
    productMediaTextLoader: InstanceType<
      typeof DataLoader<{ productMediaId: string; locale: string }, ProductMediaText>
    >;

    fileLoader: InstanceType<typeof DataLoader<{ fileId: string }, File>>;

    filterLoader: InstanceType<typeof DataLoader<{ filterId: string }, Filter>>;
    filterTextLoader: InstanceType<
      typeof DataLoader<{ filterId: string; filterOptionValue?: string; locale: string }, FilterText>
    >;

    assortmentLoader: InstanceType<typeof DataLoader<{ assortmentId: string }, Assortment>>;
    assortmentTextLoader: InstanceType<
      typeof DataLoader<{ assortmentId: string; locale: string }, AssortmentText>
    >;
    assortmentLinkLoader: InstanceType<
      typeof DataLoader<{ parentAssortmentId: string; childAssortmentId: string }, AssortmentLink>
    >;
    assortmentLinksLoader: InstanceType<
      typeof DataLoader<{ parentAssortmentId?: string; assortmentId?: string }, AssortmentLink[]>
    >;
    assortmentProductLoader: InstanceType<
      typeof DataLoader<{ assortmentId: string; productId: string }, AssortmentProduct>
    >;
    assortmentMediaTextLoader: InstanceType<
      typeof DataLoader<{ assortmentMediaId: string; locale: string }, AssortmentMediaText>
    >;

    productMediasLoader: InstanceType<typeof DataLoader<{ productId?: string }, ProductMedia[]>>;
    assortmentMediasLoader: InstanceType<
      typeof DataLoader<{ assortmentId?: string }, AssortmentMediaType[]>
    >;
  };
}

function getLocaleStrings(locale: string) {
  const localeObj = new Intl.Locale(locale);
  return [
    ...new Set([
      localeObj.baseName.toLowerCase(),
      localeObj.language.toLowerCase(),
      systemLocale.baseName.toLowerCase(),
      systemLocale.language.toLowerCase(),
    ]),
  ];
}

const loaders = async (unchainedAPI: UnchainedCore): Promise<UnchainedLoaders['loaders']> => {
  return {
    assortmentLoader: new DataLoader(async (queries) => {
      const assortmentIds = [...new Set(queries.map((q) => q.assortmentId).filter(Boolean))];

      const assortments = await unchainedAPI.modules.assortments.findAssortments({
        assortmentIds,
        includeInactive: true,
        includeLeaves: true,
      });

      const assortmentMap = {};
      for (const assortment of assortments) {
        assortmentMap[assortment._id] = assortment;
      }
      return queries.map((q) => assortmentMap[q.assortmentId]);
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

      const queryLocales = [...new Set(queries.map((q) => q.locale.toLowerCase()))];
      const textsMap = {};
      const localeMap = Object.fromEntries(
        queryLocales.flatMap((queryLocale) => {
          return getLocaleStrings(queryLocale).map((locale) => [locale, queryLocale]);
        }),
      );
      for (const text of texts) {
        const locale = localeMap[text.locale.toLowerCase()];
        textsMap[locale + text.assortmentId] = text;
      }
      return queries.map((q) => textsMap[q.locale.toLowerCase() + q.assortmentId]);
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

      const queryLocales = [...new Set(queries.map((q) => q.locale.toLowerCase()))];
      const textsMap = {};
      const localeMap = Object.fromEntries(
        queryLocales.flatMap((queryLocale) => {
          return getLocaleStrings(queryLocale).map((locale) => [locale, queryLocale]);
        }),
      );
      for (const text of texts) {
        const locale = localeMap[text.locale.toLowerCase()];
        textsMap[locale + text.assortmentMediaId] = text;
      }
      return queries.map((q) => textsMap[q.locale.toLowerCase() + q.assortmentMediaId]);
    }),

    assortmentMediasLoader: new DataLoader(async (queries) => {
      const assortmentIds = [...new Set(queries.map((q) => q.assortmentId).filter(Boolean))];
      const assortmentMediaItems = await unchainedAPI.modules.assortments.media.findAssortmentMedias({
        assortmentId: { $in: assortmentIds },
      });

      const assortmentMediaMap = {};
      for (const assortmentMedia of assortmentMediaItems) {
        if (!assortmentMediaMap[assortmentMedia.assortmentId]) {
          assortmentMediaMap[assortmentMedia.assortmentId] = [assortmentMedia];
        } else {
          assortmentMediaMap[assortmentMedia.assortmentId].push(assortmentMedia);
        }
      }
      return queries.map((q) => assortmentMediaMap[q.assortmentId] || []);
    }),

    assortmentLinkLoader: new DataLoader(async (queries) => {
      const parentAssortmentIds = [...new Set(queries.map((q) => q.parentAssortmentId).filter(Boolean))];

      const links = await unchainedAPI.modules.assortments.links.findLinks({
        parentAssortmentIds,
      });

      // TODO: Optimize
      return queries.map((q) => {
        return links.find((link) => {
          if (link.parentAssortmentId !== q.parentAssortmentId) return false;
          if (q.childAssortmentId && link.childAssortmentId !== q.childAssortmentId) return false;
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

      // TODO: Optimize
      return queries.map((q) => {
        if (q.parentAssortmentId) {
          return linksByParentAssortmentId.filter(
            (link) => link.parentAssortmentId === q.parentAssortmentId,
          );
        }
        if (q.assortmentId) {
          return linksByAssortmentId.filter(
            (link) =>
              link.parentAssortmentId === q.assortmentId || link.childAssortmentId === q.assortmentId,
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

      // TODO: Optimize
      return queries.map((q) => {
        return assortmentProducts.find((assortmentProduct) => {
          if (assortmentProduct.assortmentId !== q.assortmentId) return false;
          if (assortmentProduct.productId !== q.productId) return false;
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

      const filterMap = {};
      for (const filter of filters) {
        filterMap[filter._id] = filter;
      }

      return queries.map((q) => filterMap[q.filterId]);
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

      const queryLocales = [...new Set(queries.map((q) => q.locale.toLowerCase()))];
      const textsMap = {};
      const localeMap = Object.fromEntries(
        queryLocales.flatMap((queryLocale) => {
          return getLocaleStrings(queryLocale).map((locale) => [locale, queryLocale]);
        }),
      );
      for (const text of texts) {
        const locale = localeMap[text.locale.toLowerCase()];
        textsMap[locale + text.filterId + text.filterOptionValue] = text;
      }
      return queries.map((q) => textsMap[q.locale.toLowerCase() + q.filterId + q.filterOptionValue]);
    }),

    productLoader: new DataLoader(async (queries) => {
      const productIds = [...new Set(queries.map((q) => q.productId).filter(Boolean))]; // you don't need lodash, _.unique my ass

      const products = await unchainedAPI.modules.products.findProducts({
        productIds,
        productSelector: {
          status: { $exists: true },
        },
      });

      const productMap = {};
      for (const product of products) {
        productMap[product._id] = product;
      }

      return queries.map((q) => productMap[q.productId]);
    }),

    productLoaderBySKU: new DataLoader(async (queries) => {
      const skus = [...new Set(queries.map((q) => q.sku).filter(Boolean))]; // you don't need lodash, _.unique my ass

      const products = await unchainedAPI.modules.products.findProducts({
        productSelector: {
          'warehousing.sku': { $in: skus },
          status: { $exists: true },
        },
      });

      const productMap = {};
      for (const product of products) {
        productMap[product.warehousing!.sku!] = product;
      }

      return queries.map((q) => productMap[q.sku]);
    }),

    productTextLoader: new DataLoader(async (queries) => {
      const productIds = [...new Set(queries.map((q) => q.productId))].filter(Boolean);
      const texts = await unchainedAPI.modules.products.texts.findTexts(
        { productId: { $in: productIds } },
        {
          sort: {
            productId: 1,
          },
        },
      );
      const queryLocales = [...new Set(queries.map((q) => q.locale.toLowerCase()))];
      const textsMap = {};
      const localeMap = Object.fromEntries(
        queryLocales.flatMap((queryLocale) => {
          return getLocaleStrings(queryLocale).map((locale) => [locale, queryLocale]);
        }),
      );
      for (const text of texts) {
        const locale = localeMap[text.locale.toLowerCase()];
        textsMap[locale + text.productId] = text;
      }
      return queries.map((q) => textsMap[q.locale.toLowerCase() + q.productId]);
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

      const queryLocales = [...new Set(queries.map((q) => q.locale.toLowerCase()))];
      const textsMap = {};
      const localeMap = Object.fromEntries(
        queryLocales.flatMap((queryLocale) => {
          return getLocaleStrings(queryLocale).map((locale) => [locale, queryLocale]);
        }),
      );
      for (const text of texts) {
        const locale = localeMap[text.locale.toLowerCase()];
        textsMap[locale + text.productMediaId] = text;
      }
      return queries.map((q) => textsMap[q.locale.toLowerCase() + q.productMediaId]);
    }),

    productMediasLoader: new DataLoader(async (queries) => {
      const productIds = [...new Set(queries.map((q) => q.productId).filter(Boolean))];
      const productMediaItems = await unchainedAPI.modules.products.media.findProductMedias({
        productId: { $in: productIds },
      });

      const productMediaMap = {};
      for (const productMedia of productMediaItems) {
        if (!productMediaMap[productMedia.productId]) {
          productMediaMap[productMedia.productId] = [productMedia];
        } else {
          productMediaMap[productMedia.productId].push(productMedia);
        }
      }
      return queries.map((q) => productMediaMap[q.productId] || []);
    }),

    fileLoader: new DataLoader(async (queries) => {
      const fileIds = [...new Set(queries.map((q) => q.fileId).filter(Boolean))]; // you don't need lodash, _.unique my ass

      const files = await unchainedAPI.modules.files.findFiles({
        _id: { $in: fileIds },
      });

      const fileMap = {};
      for (const file of files) {
        fileMap[file._id] = file;
      }

      return queries.map((q) => fileMap[q.fileId]);
    }),
  };
};

export default loaders;
