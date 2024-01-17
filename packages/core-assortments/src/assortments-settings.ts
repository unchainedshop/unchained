import { AssortmentsSettingsOptions } from '@unchainedshop/types/assortments.js';
import { slugify as defaultSlugify } from '@unchainedshop/utils';
import zipTreeByDeepness from './utils/tree-zipper/zipTreeByDeepness.js';
import makeMongoDBCache from './product-cache/mongodb.js';

export const assortmentsSettings = {
  zipTree: null,
  slugify: null,
  setCachedProductIds: null,
  getCachedProductIds: null,
  configureSettings: async (
    {
      setCachedProductIds,
      getCachedProductIds,
      zipTree = zipTreeByDeepness,
      slugify = defaultSlugify,
    }: AssortmentsSettingsOptions,
    db,
  ) => {
    const defaultCache = await makeMongoDBCache(db);
    assortmentsSettings.zipTree = zipTree;
    assortmentsSettings.slugify = slugify;
    assortmentsSettings.setCachedProductIds = setCachedProductIds || defaultCache.setCachedProductIds;
    assortmentsSettings.getCachedProductIds = getCachedProductIds || defaultCache.getCachedProductIds;
  },
};
