import { AssortmentsSettingsOptions } from '@unchainedshop/types/assortments';
import { Db } from '@unchainedshop/types/common';
import { slugify as defaultSlugify } from '@unchainedshop/utils';
import zipTreeByDeepness from './utils/tree-zipper/zipTreeByDeepness';
import makeMongoDBCache from './product-cache/mongodb';

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
    db: Db,
  ) => {
    const defaultCache = await makeMongoDBCache(db);
    assortmentsSettings.zipTree = zipTree;
    assortmentsSettings.slugify = slugify;
    assortmentsSettings.setCachedProductIds = setCachedProductIds || defaultCache.setCachedProductIds;
    assortmentsSettings.getCachedProductIds = getCachedProductIds || defaultCache.getCachedProductIds;
  },
};
