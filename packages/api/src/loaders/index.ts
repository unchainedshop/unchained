import DataLoader from 'dataloader';
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
import buildTextMap from './buildTextMap.js';
import buildLocaleMap from './buildLocaleMap.js';

const loaders = async (unchainedAPI: UnchainedCore) => {
  return {
    assortmentLoader: new DataLoader<{ assortmentId: string }, Assortment>(async (queries) => {
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

        const localeMap = buildLocaleMap(queries, texts);
        const textsMap = buildTextMap(localeMap, texts, (text) => text.assortmentId);
        return queries.map((q) => textsMap[q.locale + q.assortmentId]);
      },
    ),

    assortmentMediaTextLoader: new DataLoader<
      { assortmentMediaId: string; locale: string },
      AssortmentMediaText
    >(async (queries) => {
      const assortmentMediaIds = [...new Set(queries.map((q) => q.assortmentMediaId).filter(Boolean))];

      const texts = await unchainedAPI.modules.assortments.media.texts.findMediaTexts(
        { assortmentMediaId: { $in: assortmentMediaIds } },
        {
          sort: {
            assortmentMediaId: 1,
          },
        },
      );

      const localeMap = buildLocaleMap(queries, texts);
      const textsMap = buildTextMap(localeMap, texts, (text) => text.assortmentMediaId);
      return queries.map((q) => textsMap[q.locale + q.assortmentMediaId]);
    }),

    assortmentMediasLoader: new DataLoader<{ assortmentId?: string }, AssortmentMediaType[]>(
      async (queries) => {
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
      },
    ),

    assortmentLinkLoader: new DataLoader<
      { parentAssortmentId: string; childAssortmentId: string },
      AssortmentLink
    >(async (queries) => {
      const parentAssortmentIds = [...new Set(queries.map((q) => q.parentAssortmentId).filter(Boolean))];

      const links = await unchainedAPI.modules.assortments.links.findLinks({
        parentAssortmentIds,
      });

      const assortmentLinkMap = {};
      for (const link of links) {
        if (!assortmentLinkMap[link.parentAssortmentId]) {
          assortmentLinkMap[link.parentAssortmentId] = [link];
        } else {
          assortmentLinkMap[link.parentAssortmentId].push(link);
        }
      }

      return queries.map((q) => {
        if (q.childAssortmentId) {
          return assortmentLinkMap[q.parentAssortmentId].find(
            (link) => link.childAssortmentId === q.childAssortmentId,
          );
        }
        return assortmentLinkMap[q.parentAssortmentId][0];
      });
    }),

    assortmentLinksLoader: new DataLoader<
      { parentAssortmentId?: string; childAssortmentId?: string; assortmentId?: string },
      AssortmentLink[]
    >(async (queries) => {
      const parentAssortmentIds = queries.flatMap((q) => q.parentAssortmentId).filter(Boolean);
      const childAssortmentIds = queries.flatMap((q) => q.childAssortmentId).filter(Boolean);
      const assortmentIds = queries.flatMap((q) => q.assortmentId).filter(Boolean);

      const allLinks = await unchainedAPI.modules.assortments.links.findLinks({
        assortmentIds: [...new Set([...parentAssortmentIds, ...childAssortmentIds, ...assortmentIds])],
      });

      const parentAssortmentLinkMap = {};
      const childAssortmentLinkMap = {};

      for (const link of allLinks) {
        if (!parentAssortmentLinkMap[link.parentAssortmentId]) {
          parentAssortmentLinkMap[link.parentAssortmentId] = [link];
        } else {
          parentAssortmentLinkMap[link.parentAssortmentId].push(link);
        }

        if (!childAssortmentLinkMap[link.childAssortmentId]) {
          childAssortmentLinkMap[link.childAssortmentId] = [link];
        } else {
          childAssortmentLinkMap[link.childAssortmentId].push(link);
        }
      }

      return queries.map((q) => {
        if (q.parentAssortmentId) {
          return parentAssortmentLinkMap[q.parentAssortmentId] || [];
        } else if (q.childAssortmentId) {
          return childAssortmentLinkMap[q.childAssortmentId] || [];
        }
        return [
          ...(parentAssortmentLinkMap[q.assortmentId] || []),
          ...(childAssortmentLinkMap[q.assortmentId] || []),
        ];
      });
    }),

    assortmentProductLoader: new DataLoader<
      { assortmentId: string; productId: string },
      AssortmentProduct
    >(async (queries) => {
      const assortmentIds = [...new Set(queries.map((q) => q.assortmentId).filter(Boolean))];

      const assortmentProducts = await unchainedAPI.modules.assortments.products.findAssortmentProducts({
        assortmentIds,
      });

      const assortmentProductMap = {};
      for (const assortmentProduct of assortmentProducts) {
        assortmentProductMap[assortmentProduct.assortmentId + assortmentProduct.productId] =
          assortmentProduct;
      }
      return queries.map((q) => assortmentProductMap[q.assortmentId + q.productId]);
    }),

    assortmentProductsLoader: new DataLoader<{ productId: string }, AssortmentProduct[]>(
      async (queries) => {
        const productIds = [...new Set(queries.map((q) => q.productId).filter(Boolean))];

        const assortmentProducts =
          await unchainedAPI.modules.assortments.products.findAssortmentProducts({
            productIds,
          });

        const assortmentProductsMap = {};
        for (const assortmentProduct of assortmentProducts) {
          if (!assortmentProductsMap[assortmentProduct.productId]) {
            assortmentProductsMap[assortmentProduct.productId] = [assortmentProduct];
          } else {
            assortmentProductsMap[assortmentProduct.productId].push(assortmentProduct);
          }
        }
        return queries.map((q) => assortmentProductsMap[q.productId] || []);
      },
    ),

    filterLoader: new DataLoader<{ filterId: string }, Filter>(async (queries) => {
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

      const localeMap = buildLocaleMap(queries, texts);
      const textsMap = buildTextMap(localeMap, texts, (text) => text.filterId + text.filterOptionValue);
      return queries.map((q) => textsMap[q.locale + q.filterId + q.filterOptionValue]);
    }),

    productLoader: new DataLoader<{ productId: string }, Product>(async (queries) => {
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

    productLoaderBySKU: new DataLoader<{ sku: string }, Product>(async (queries) => {
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

    productTextLoader: new DataLoader<{ productId: string; locale: string }, ProductText>(
      async (queries) => {
        const productIds = [...new Set(queries.map((q) => q.productId))].filter(Boolean);
        const texts = await unchainedAPI.modules.products.texts.findTexts(
          { productId: { $in: productIds } },
          {
            sort: {
              productId: 1,
            },
          },
        );
        const localeMap = buildLocaleMap(queries, texts);
        const textsMap = buildTextMap(localeMap, texts, (text) => text.productId);
        return queries.map((q) => textsMap[q.locale + q.productId]);
      },
    ),

    productMediaTextLoader: new DataLoader<{ productMediaId: string; locale: string }, ProductMediaText>(
      async (queries) => {
        const productMediaIds = [...new Set(queries.map((q) => q.productMediaId).filter(Boolean))];

        const texts = await unchainedAPI.modules.products.media.texts.findMediaTexts(
          { productMediaId: { $in: productMediaIds } },
          {
            sort: {
              productMediaId: 1,
            },
          },
        );

        const localeMap = buildLocaleMap(queries, texts);
        const textsMap = buildTextMap(localeMap, texts, (text) => text.productMediaId);
        return queries.map((q) => textsMap[q.locale + q.productMediaId]);
      },
    ),

    productMediasLoader: new DataLoader<{ productId?: string }, ProductMedia[]>(async (queries) => {
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

    fileLoader: new DataLoader<{ fileId: string }, File>(async (queries) => {
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

export type UnchainedLoaders = Awaited<ReturnType<typeof loaders>>;

export default loaders;
