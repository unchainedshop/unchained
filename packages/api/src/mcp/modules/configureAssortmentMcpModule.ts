import { Context } from '../../context.js';
import { Assortment, AssortmentText } from '@unchainedshop/core-assortments';
import { AssortmentNotFoundError, AssortmentMediaNotFoundError } from '../../errors.js';
import { getNormalizedAssortmentDetails } from '../utils/getNormalizedAssortmentDetails.js';

export type AssortmentOperationType =
  | 'CREATE'
  | 'UPDATE'
  | 'REMOVE'
  | 'GET'
  | 'LIST'
  | 'COUNT'
  | 'UPDATE_STATUS'
  | 'ADD_MEDIA'
  | 'REMOVE_MEDIA'
  | 'REORDER_MEDIA'
  | 'GET_MEDIA'
  | 'ADD_PRODUCT'
  | 'REMOVE_PRODUCT'
  | 'GET_PRODUCTS'
  | 'REORDER_PRODUCTS'
  | 'ADD_FILTER'
  | 'REMOVE_FILTER'
  | 'GET_FILTERS'
  | 'REORDER_FILTERS'
  | 'ADD_LINK'
  | 'REMOVE_LINK'
  | 'GET_LINKS'
  | 'REORDER_LINKS'
  | 'GET_CHILDREN'
  | 'SET_BASE'
  | 'SEARCH_PRODUCTS'
  | 'GET_TEXTS'
  | 'GET_MEDIA_TEXTS'
  | 'UPDATE_MEDIA_TEXTS';

export interface AssortmentEntity {
  isRoot?: boolean;
  isActive?: boolean;
  tags?: string[];
  sequence?: number;
  meta?: Record<string, any>;
}

export interface AssortmentTextEntity {
  locale: string;
  slug?: string;
  title?: string;
  subtitle?: string;
  description?: string;
}

export interface AssortmentMediaTextEntity {
  locale: string;
  title?: string;
  subtitle?: string;
}

export interface AssortmentListOptions {
  limit?: number;
  offset?: number;
  tags?: string[];
  slugs?: string[];
  queryString?: string;
  includeInactive?: boolean;
  includeLeaves?: boolean;
  sort?: {
    key: string;
    value: 'ASC' | 'DESC';
  }[];
}

export interface AssortmentCountOptions {
  tags?: string[];
  slugs?: string[];
  queryString?: string;
  includeInactive?: boolean;
  includeLeaves?: boolean;
}

export interface AssortmentMediaOptions {
  tags?: string[];
  limit?: number;
  offset?: number;
}

export interface AssortmentSearchProductsOptions {
  queryString?: string;
  limit?: number;
  offset?: number;
  includeInactive?: boolean;
}

export const configureAssortmentMcpModule = (context: Context) => {
  const { modules, services } = context;

  return {
    create: async (assortmentEntity: AssortmentEntity, texts?: AssortmentTextEntity[]) => {
      const newAssortment = await modules.assortments.create(assortmentEntity as Assortment);
      let assortmentTexts: any[] = [];

      if (texts && texts.length > 0) {
        assortmentTexts = await modules.assortments.texts.updateTexts(
          newAssortment._id,
          texts as unknown as AssortmentText[],
        );
      }

      return {
        assortment: {
          ...newAssortment,
          texts: assortmentTexts,
        },
      };
    },

    update: async (assortmentId: string, assortmentEntity: AssortmentEntity) => {
      const existingAssortment = await modules.assortments.findAssortment({ assortmentId });
      if (!existingAssortment) throw new AssortmentNotFoundError({ assortmentId });

      const updateData: any = {};

      if (assortmentEntity.isRoot !== undefined) updateData.isRoot = assortmentEntity.isRoot;
      if (assortmentEntity.isActive !== undefined) updateData.isActive = assortmentEntity.isActive;
      if (assortmentEntity.tags !== undefined) updateData.tags = assortmentEntity.tags;
      if (assortmentEntity.sequence !== undefined) updateData.sequence = assortmentEntity.sequence;
      if (assortmentEntity.meta !== undefined) updateData.meta = assortmentEntity.meta;

      if (Object.keys(updateData).length > 0) {
        await modules.assortments.update(assortmentId, updateData);
      }

      return await getNormalizedAssortmentDetails({ assortmentId }, context);
    },

    remove: async (assortmentId: string) => {
      const assortment = await modules.assortments.findAssortment({ assortmentId });
      if (!assortment) throw new AssortmentNotFoundError({ assortmentId });

      await modules.assortments.delete(assortmentId);
      return assortment;
    },

    get: async (assortmentId?: string, slug?: string) => {
      let query: any = {};
      if (assortmentId) query = { assortmentId };
      else if (slug) query = { slug };
      else throw new Error('Either assortmentId or slug must be provided');

      const assortment = await modules.assortments.findAssortment(query);
      if (!assortment) throw new AssortmentNotFoundError(query);

      return getNormalizedAssortmentDetails({ assortmentId: assortment._id }, context);
    },

    list: async (options: AssortmentListOptions = {}) => {
      const {
        limit = 50,
        offset = 0,
        tags,
        slugs,
        queryString,
        includeInactive = false,
        includeLeaves = false,
        sort,
      } = options;

      const sortOptions = sort?.map((s) => ({ key: s.key, value: s.value as any })) || undefined;

      const assortments = await modules.assortments.findAssortments({
        limit,
        offset,
        tags,
        slugs,
        queryString,
        includeInactive,
        includeLeaves,
        sort: sortOptions,
      });
      return Promise.all(
        assortments?.map(({ _id }) => getNormalizedAssortmentDetails({ assortmentId: _id }, context)) ||
          [],
      );
    },

    count: async (options: AssortmentCountOptions = {}) => {
      const { tags, slugs, queryString, includeInactive = false, includeLeaves = false } = options;

      return await modules.assortments.count({
        tags,
        slugs,
        queryString,
        includeInactive,
        includeLeaves,
      });
    },

    updateStatus: async (assortmentId: string, action: 'ACTIVATE' | 'DEACTIVATE') => {
      const assortment = await modules.assortments.findAssortment({ assortmentId });
      if (!assortment) throw new AssortmentNotFoundError({ assortmentId });

      const updateData = {
        isActive: action === 'ACTIVATE',
      };

      await modules.assortments.update(assortmentId, updateData as any);
      return await getNormalizedAssortmentDetails({ assortmentId }, context);
    },

    addMedia: async (assortmentId: string, mediaId: string, tags?: string[]) => {
      const assortment = await modules.assortments.findAssortment({ assortmentId });
      if (!assortment) throw new AssortmentNotFoundError({ assortmentId });

      const assortmentMedia = await modules.assortments.media.create({
        assortmentId,
        mediaId,
        tags,
      } as any);

      return assortmentMedia;
    },

    removeMedia: async (mediaId: string) => {
      const result = await modules.assortments.media.delete(mediaId);
      return result;
    },

    reorderMedia: async (sortKeys: { assortmentMediaId: string; sortKey: number }[]) => {
      return await modules.assortments.media.updateManualOrder({ sortKeys: sortKeys as any });
    },

    getMedia: async (assortmentId: string, options: AssortmentMediaOptions = {}) => {
      const assortment = await modules.assortments.findAssortment({ assortmentId });
      if (!assortment) throw new AssortmentNotFoundError({ assortmentId });

      const { tags, limit = 50, offset = 0 } = options;

      if (offset || tags) {
        return await modules.assortments.media.findAssortmentMedias({
          assortmentId,
          limit,
          offset,
          tags,
        });
      } else {
        return (await context.loaders.assortmentMediasLoader.load({ assortmentId })).slice(
          offset,
          offset + limit,
        );
      }
    },

    updateMediaTexts: async (assortmentMediaId: string, texts: AssortmentMediaTextEntity[]) => {
      const media = await modules.assortments.media.findAssortmentMedia({ assortmentMediaId });
      if (!media) throw new AssortmentMediaNotFoundError({ assortmentMediaId });

      return await modules.assortments.media.texts.updateMediaTexts(assortmentMediaId, texts);
    },

    addProduct: async (assortmentId: string, productId: string, tags?: string[]) => {
      const assortment = await modules.assortments.findAssortment({ assortmentId });
      if (!assortment) throw new AssortmentNotFoundError({ assortmentId });

      const product = await modules.products.findProduct({ productId });
      if (!product) throw new Error(`Product not found: ${productId}`);

      const assortmentProduct = await modules.assortments.products.create({
        assortmentId,
        productId,
        tags,
      } as any);

      return assortmentProduct;
    },

    removeProduct: async (productId: string) => {
      const result = await modules.assortments.products.delete(productId);
      return result;
    },

    getProducts: async (assortmentId: string) => {
      const assortment = await modules.assortments.findAssortment({ assortmentId });
      if (!assortment) throw new AssortmentNotFoundError({ assortmentId });

      return await modules.assortments.products.findAssortmentProducts(
        { assortmentId },
        { sort: { sortKey: 1 } },
      );
    },

    reorderProducts: async (sortKeys: { assortmentProductId: string; sortKey: number }[]) => {
      return await modules.assortments.products.updateManualOrder({ sortKeys: sortKeys as any });
    },

    addFilter: async (assortmentId: string, filterId: string, tags?: string[]) => {
      const assortment = await modules.assortments.findAssortment({ assortmentId });
      if (!assortment) throw new AssortmentNotFoundError({ assortmentId });

      const filter = await modules.filters.findFilter({ filterId });
      if (!filter) throw new Error(`Filter not found: ${filterId}`);

      const assortmentFilter = await modules.assortments.filters.create({
        assortmentId,
        filterId,
        tags,
      } as any);

      return assortmentFilter;
    },

    removeFilter: async (filterId: string) => {
      const result = await modules.assortments.filters.delete(filterId);
      return result;
    },

    getFilters: async (assortmentId: string) => {
      const assortment = await modules.assortments.findAssortment({ assortmentId });
      if (!assortment) throw new AssortmentNotFoundError({ assortmentId });

      return await modules.assortments.filters.findFilters({ assortmentId }, { sort: { sortKey: 1 } });
    },

    reorderFilters: async (sortKeys: { assortmentFilterId: string; sortKey: number }[]) => {
      return await modules.assortments.filters.updateManualOrder({ sortKeys: sortKeys as any });
    },

    addLink: async (parentAssortmentId: string, childAssortmentId: string, tags?: string[]) => {
      const parentAssortment = await modules.assortments.findAssortment({
        assortmentId: parentAssortmentId,
      });
      if (!parentAssortment) throw new AssortmentNotFoundError({ assortmentId: parentAssortmentId });

      const childAssortment = await modules.assortments.findAssortment({
        assortmentId: childAssortmentId,
      });
      if (!childAssortment) throw new Error(`Child assortment not found: ${childAssortmentId}`);

      const assortmentLink = await modules.assortments.links.create({
        parentAssortmentId,
        childAssortmentId,
        tags,
      } as any);

      return assortmentLink;
    },

    removeLink: async (assortmentLinkId: string) => {
      const existing = await modules.assortments.links.findLink({ assortmentLinkId });
      if (!existing) throw new Error(`Assortment link not found: ${assortmentLinkId}`);

      const result = await modules.assortments.links.delete(assortmentLinkId);
      return result;
    },

    getLinks: async (assortmentId: string) => {
      const assortment = await modules.assortments.findAssortment({ assortmentId });
      if (!assortment) throw new AssortmentNotFoundError({ assortmentId });

      return await context.loaders.assortmentLinksLoader.load({
        assortmentId,
      });
    },

    reorderLinks: async (sortKeys: { assortmentLinkId: string; sortKey: number }[]) => {
      return await modules.assortments.links.updateManualOrder({ sortKeys: sortKeys as any });
    },

    getChildren: async (assortmentId?: string, includeInactive = false) => {
      if (assortmentId) {
        const assortment = await modules.assortments.findAssortment({ assortmentId });
        if (!assortment) throw new AssortmentNotFoundError({ assortmentId });
      }

      return await modules.assortments.children({ assortmentId, includeInactive });
    },

    setBase: async (assortmentId: string) => {
      const assortment = await modules.assortments.findAssortment({ assortmentId });
      if (!assortment) throw new AssortmentNotFoundError({ assortmentId });

      await modules.assortments.setBase(assortmentId);
      return await getNormalizedAssortmentDetails({ assortmentId }, context);
    },

    searchProducts: async (assortmentId: string, options: AssortmentSearchProductsOptions = {}) => {
      const assortment = await modules.assortments.findAssortment({ assortmentId });
      if (!assortment) throw new AssortmentNotFoundError({ assortmentId });

      const { queryString, limit = 50, offset = 0, includeInactive = false } = options;

      const productIds = await modules.assortments.findProductIds({
        assortmentId,
      });

      const filterIds = await modules.assortments.filters.findFilterIds({
        assortmentId,
      });

      const result = await services.filters.searchProducts(
        {
          queryString,
          includeInactive,
          productIds,
          filterIds,
        } as any,
        {
          locale: context.locale,
        },
      );

      return await modules.products.search.findFilteredProducts({
        limit,
        offset,
        productIds: result.aggregatedFilteredProductIds,
        productSelector: result.searchConfiguration.productSelector,
        sort: result.searchConfiguration.sortStage,
      });
    },

    getTexts: async (assortmentId: string) => {
      const assortment = await modules.assortments.findAssortment({ assortmentId });
      if (!assortment) throw new AssortmentNotFoundError({ assortmentId });

      return await modules.assortments.texts.findTexts({ assortmentId });
    },

    getMediaTexts: async (assortmentMediaId: string) => {
      const media = await modules.assortments.media.findAssortmentMedia({ assortmentMediaId });
      if (!media) throw new AssortmentMediaNotFoundError({ assortmentMediaId });

      return await modules.assortments.media.texts.findMediaTexts({ assortmentMediaId });
    },
  };
};

export type AssortmentMcpModule = ReturnType<typeof configureAssortmentMcpModule>;
