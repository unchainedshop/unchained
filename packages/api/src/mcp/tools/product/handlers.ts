import {
  ProductEntity,
  ProductTextEntity,
  ProductMediaTextEntity,
  ProductVariationEntity,
  ProductVariationTextEntity,
  ProductAssignmentVector,
} from '../../modules/configureProductMcpModule.js';
import { ActionName, Handler } from './schemas.js';

const actionHandlers: { [K in ActionName]: Handler<K> } = {
  CREATE: async (productModule, { product, texts }) => {
    return await productModule.create(product as ProductEntity, texts as ProductTextEntity[]);
  },

  UPDATE: async (productModule, { productId, product }) => {
    const updatedProduct = await productModule.update(productId, product as ProductEntity);
    return { product: updatedProduct };
  },

  REMOVE: async (productModule, { productId }) => {
    const removedProduct = await productModule.remove(productId);
    return { removedProduct };
  },

  GET: async (productModule, { productId, slug, sku }) => {
    const product = await productModule.get(productId, slug, sku);
    return { product };
  },

  LIST: async (productModule, { limit, offset, tags, slugs, queryString, includeDrafts, sort }) => {
    const products = await productModule.list({
      limit,
      offset,
      tags,
      slugs,
      queryString,
      includeDrafts,
      sort: sort as any,
    });
    return { products };
  },

  COUNT: async (productModule, { tags, slugs, queryString, includeDrafts }) => {
    const count = await productModule.count({ tags, slugs, queryString, includeDrafts });
    return { count };
  },

  UPDATE_STATUS: async (productModule, { productId, statusAction }) => {
    const product = await productModule.updateStatus(productId, statusAction);
    return { product };
  },

  ADD_MEDIA: async (productModule, { productId, mediaName, url }) => {
    const media = await productModule.addMedia(productId, mediaName, url);
    return { media };
  },

  REMOVE_MEDIA: async (productModule, { productMediaId }) => {
    return await productModule.removeMedia(productMediaId);
  },

  REORDER_MEDIA: async (productModule, { sortKeys }) => {
    const media = await productModule.reorderMedia(
      sortKeys.filter((sk) => sk.productMediaId && sk.sortKey !== undefined) as {
        productMediaId: string;
        sortKey: number;
      }[],
    );
    return { media };
  },

  GET_MEDIA: async (productModule, { productId, tags, limit, offset }) => {
    const media = await productModule.getMedia(productId, { tags, limit, offset });
    return { media };
  },

  UPDATE_MEDIA_TEXTS: async (productModule, { productMediaId, mediaTexts }) => {
    const texts = await productModule.updateMediaTexts(
      productMediaId,
      mediaTexts as ProductMediaTextEntity[],
    );
    return { texts };
  },

  CREATE_VARIATION: async (productModule, { productId, variation, variationTexts }) => {
    const newVariation = await productModule.createVariation(
      productId,
      variation as ProductVariationEntity,
      variationTexts as ProductVariationTextEntity[],
    );
    return { variation: newVariation };
  },

  REMOVE_VARIATION: async (productModule, { productVariationId }) => {
    const removedVariation = await productModule.removeVariation(productVariationId);
    return { removedVariation };
  },

  ADD_VARIATION_OPTION: async (productModule, { productVariationId, option, variationTexts }) => {
    const newOption = await productModule.addVariationOption(
      productVariationId,
      option,
      variationTexts as ProductVariationTextEntity[],
    );
    return { variation: newOption };
  },

  REMOVE_VARIATION_OPTION: async (
    productModule,
    { productVariationId, productVariationOptionValue },
  ) => {
    return await productModule.removeVariationOption(productVariationId, productVariationOptionValue);
  },

  UPDATE_VARIATION_TEXTS: async (
    productModule,
    { productVariationId, variationTexts, productVariationOptionValue },
  ) => {
    const texts = await productModule.updateVariationTexts(
      productVariationId,
      variationTexts as ProductVariationTextEntity[],
      productVariationOptionValue,
    );
    return { texts };
  },

  GET_VARIATION_PRODUCTS: async (productModule, { productId, vectors, includeInactive }) => {
    const products = await productModule.getVariationProducts(
      productId,
      vectors as ProductAssignmentVector[],
      includeInactive,
    );
    return { products };
  },

  GET_ASSIGNMENTS: async (productModule, { productId, includeInactive }) => {
    const assignments = await productModule.getProductAssignments(productId, includeInactive);
    return { assignments };
  },

  ADD_ASSIGNMENT: async (productModule, { proxyId, assignProductId, vectors }) => {
    const assignment = await productModule.addAssignment(
      proxyId,
      assignProductId,
      vectors as ProductAssignmentVector[],
    );
    return { assignment };
  },

  REMOVE_ASSIGNMENT: async (productModule, { proxyId, vectors }) => {
    return await productModule.removeAssignment(proxyId, vectors as ProductAssignmentVector[]);
  },

  ADD_BUNDLE_ITEM: async (productModule, { bundleId, bundleProductId, quantity }) => {
    const result = await productModule.addBundleItem(bundleId, bundleProductId, quantity);
    return { product: result };
  },

  REMOVE_BUNDLE_ITEM: async (productModule, { bundleId, index }) => {
    const result = await productModule.removeBundleItem(bundleId, index);
    return { product: result };
  },

  GET_BUNDLE_ITEMS: async (productModule, { bundleId }) => {
    const items = await productModule.getBundleItems(bundleId);
    return { bundleItems: items };
  },

  GET_CATALOG_PRICE: async (productModule, { productId, quantity, currencyCode }) => {
    const price = await productModule.getCatalogPrice(productId, quantity, currencyCode);
    return { price };
  },

  SIMULATE_PRICE: async (productModule, { productId, vectors, quantity, currencyCode, useNetPrice }) => {
    const price = await productModule.simulatePrice(
      productId,
      (vectors as ProductAssignmentVector[]) || [],
      quantity,
      currencyCode,
      useNetPrice,
    );
    return { price };
  },

  SIMULATE_PRICE_RANGE: async (
    productModule,
    { productId, vectors, quantity, currencyCode, useNetPrice },
  ) => {
    const priceRange = await productModule.simulatePriceRange(
      productId,
      vectors as ProductAssignmentVector[],
      quantity,
      currencyCode,
      useNetPrice,
    );
    return { priceRange };
  },

  GET_PRODUCT_TEXTS: async (productModule, { productId }) => {
    const texts = await productModule.getProductTexts(productId);
    return { texts };
  },

  GET_VARIATION_TEXTS: async (productModule, { productVariationId, productVariationOptionValue }) => {
    const texts = await productModule.getVariationTexts(productVariationId, productVariationOptionValue);
    return { texts };
  },

  GET_MEDIA_TEXTS: async (productModule, { productMediaId }) => {
    const texts = await productModule.getMediaTexts(productMediaId);
    return { texts };
  },

  GET_REVIEWS: async (productModule, { productId, limit, offset, queryString, sort }) => {
    const reviews = await productModule.getReviews(productId, {
      limit,
      offset,
      queryString,
      sort: sort as any,
    });
    return { reviews };
  },

  COUNT_REVIEWS: async (productModule, { productId, queryString }) => {
    const count = await productModule.countReviews(productId, queryString);
    return { count };
  },

  GET_SIBLINGS: async (productModule, { productId, assortmentId, includeInactive }) => {
    const siblings = await productModule.getSiblings(productId, assortmentId, includeInactive);
    return { siblings };
  },
};

export default actionHandlers;
