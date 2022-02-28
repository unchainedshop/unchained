import { AssortmentsSettingsOptions } from '@unchainedshop/types/assortments';
import { Db } from '@unchainedshop/types/common';
import zipTreeByDeepness from './utils/tree-zipper/zipTreeByDeepness';
import makeMongoDBCache from './product-cache/mongodb';

export const assortmentsSettings = {
  zipTree: null,
  setCachedProductIds: null,
  getCachedProductIds: null,
  configureSettings: async (
    {
      setCachedProductIds,
      getCachedProductIds,
      zipTree = zipTreeByDeepness,
    }: AssortmentsSettingsOptions,
    db: Db,
  ) => {
    const defaultCache = await makeMongoDBCache(db);
    assortmentsSettings.zipTree = zipTree;
    assortmentsSettings.setCachedProductIds = setCachedProductIds || defaultCache.setCachedProductIds;
    assortmentsSettings.getCachedProductIds = getCachedProductIds || defaultCache.getCachedProductIds;
  },
};
