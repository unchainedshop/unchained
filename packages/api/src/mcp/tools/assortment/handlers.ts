import {
  AssortmentEntity,
  AssortmentTextEntity,
  AssortmentMediaTextEntity,
} from '../../modules/configureAssortmentMcpModule.js';
import { ActionName, Handler } from './schemas.js';

const actionHandlers: { [K in ActionName]: Handler<K> } = {
  CREATE: async (assortmentModule, { assortment, texts }) => {
    return await assortmentModule.create(
      assortment as AssortmentEntity,
      texts as AssortmentTextEntity[],
    );
  },

  UPDATE: async (assortmentModule, { assortmentId, assortment }) => {
    const updatedAssortment = await assortmentModule.update(
      assortmentId,
      assortment as AssortmentEntity,
    );
    return { assortment: updatedAssortment };
  },

  REMOVE: async (assortmentModule, { assortmentId }) => {
    const removedAssortment = await assortmentModule.remove(assortmentId);
    return { removedAssortment };
  },

  GET: async (assortmentModule, { assortmentId, slug }) => {
    const assortment = await assortmentModule.get(assortmentId, slug);
    return { assortment };
  },

  LIST: async (
    assortmentModule,
    { limit, offset, tags, slugs, queryString, includeInactive, includeLeaves, sort },
  ) => {
    const assortments = await assortmentModule.list({
      limit,
      offset,
      tags,
      slugs,
      queryString,
      includeInactive,
      includeLeaves,
      sort: sort as any,
    });
    return { assortments };
  },

  COUNT: async (assortmentModule, { tags, slugs, queryString, includeInactive, includeLeaves }) => {
    const count = await assortmentModule.count({
      tags,
      slugs,
      queryString,
      includeInactive,
      includeLeaves,
    });
    return { count };
  },

  UPDATE_STATUS: async (assortmentModule, { assortmentId, statusAction }) => {
    const assortment = await assortmentModule.updateStatus(assortmentId, statusAction);
    return { assortment };
  },

  ADD_MEDIA: async (assortmentModule, { assortmentId, mediaId, tags }) => {
    const media = await assortmentModule.addMedia(assortmentId, mediaId, tags);
    return { media };
  },

  REMOVE_MEDIA: async (assortmentModule, { mediaId }) => {
    return await assortmentModule.removeMedia(mediaId);
  },

  REORDER_MEDIA: async (assortmentModule, { sortKeys }) => {
    const media = await assortmentModule.reorderMedia(
      sortKeys.filter(
        (sk) => 'assortmentMediaId' in sk && sk.assortmentMediaId && sk.sortKey !== undefined,
      ) as {
        assortmentMediaId: string;
        sortKey: number;
      }[],
    );
    return { media };
  },

  GET_MEDIA: async (assortmentModule, { assortmentId, tags, limit, offset }) => {
    const media = await assortmentModule.getMedia(assortmentId, { tags, limit, offset });
    return { media };
  },

  UPDATE_MEDIA_TEXTS: async (assortmentModule, { assortmentMediaId, mediaTexts }) => {
    const texts = await assortmentModule.updateMediaTexts(
      assortmentMediaId,
      mediaTexts as AssortmentMediaTextEntity[],
    );
    return { texts };
  },

  ADD_PRODUCT: async (assortmentModule, { assortmentId, productId, tags }) => {
    const product = await assortmentModule.addProduct(assortmentId, productId, tags);
    return { product };
  },

  REMOVE_PRODUCT: async (assortmentModule, { assortmentProductId }) => {
    return await assortmentModule.removeProduct(assortmentProductId);
  },

  GET_PRODUCTS: async (assortmentModule, { assortmentId }) => {
    const products = await assortmentModule.getProducts(assortmentId);
    return { products };
  },

  REORDER_PRODUCTS: async (assortmentModule, { sortKeys }) => {
    const products = await assortmentModule.reorderProducts(
      sortKeys.filter(
        (sk) => 'assortmentProductId' in sk && sk.assortmentProductId && sk.sortKey !== undefined,
      ) as {
        assortmentProductId: string;
        sortKey: number;
      }[],
    );
    return { products };
  },

  ADD_FILTER: async (assortmentModule, { assortmentId, filterId, tags }) => {
    const filter = await assortmentModule.addFilter(assortmentId, filterId, tags);
    return { filter };
  },

  REMOVE_FILTER: async (assortmentModule, { assortmentFilterId }) => {
    return assortmentModule.removeFilter(assortmentFilterId);
  },

  GET_FILTERS: async (assortmentModule, { assortmentId }) => {
    const filters = await assortmentModule.getFilters(assortmentId);
    return { filters };
  },

  REORDER_FILTERS: async (assortmentModule, { sortKeys }) => {
    const filters = await assortmentModule.reorderFilters(
      sortKeys.filter(
        (sk) => 'assortmentFilterId' in sk && sk.assortmentFilterId && sk.sortKey !== undefined,
      ) as {
        assortmentFilterId: string;
        sortKey: number;
      }[],
    );
    return { filters };
  },

  ADD_LINK: async (assortmentModule, { parentAssortmentId, childAssortmentId, tags }) => {
    const assortment = await assortmentModule.addLink(parentAssortmentId, childAssortmentId, tags);
    return { assortment };
  },

  REMOVE_LINK: async (assortmentModule, { assortmentLinkId }) => {
    await assortmentModule.removeLink(assortmentLinkId);
    return { success: true };
  },

  GET_LINKS: async (assortmentModule, { assortmentId }) => {
    const assortments = await assortmentModule.getLinks(assortmentId);
    return { assortments };
  },

  REORDER_LINKS: async (assortmentModule, { sortKeys }) => {
    const assortments = await assortmentModule.reorderLinks(
      sortKeys.filter(
        (sk) => 'assortmentLinkId' in sk && sk.assortmentLinkId && sk.sortKey !== undefined,
      ) as {
        assortmentLinkId: string;
        sortKey: number;
      }[],
    );
    return { assortments };
  },

  GET_CHILDREN: async (assortmentModule, { assortmentId, includeInactive }) => {
    const children = await assortmentModule.getChildren(assortmentId, includeInactive);
    return { assortments: children };
  },

  SET_BASE: async (assortmentModule, { assortmentId }) => {
    const assortment = await assortmentModule.setBase(assortmentId);
    return { assortment };
  },

  SEARCH_PRODUCTS: async (
    assortmentModule,
    { assortmentId, queryString, limit, offset, includeInactive },
  ) => {
    const products = await assortmentModule.searchProducts(assortmentId, {
      queryString,
      limit,
      offset,
      includeInactive,
    });
    return { products };
  },

  GET_TEXTS: async (assortmentModule, { assortmentId }) => {
    const texts = await assortmentModule.getTexts(assortmentId);
    return { texts };
  },

  GET_MEDIA_TEXTS: async (assortmentModule, { assortmentMediaId }) => {
    const texts = await assortmentModule.getMediaTexts(assortmentMediaId);
    return { texts };
  },
};

export default actionHandlers;
