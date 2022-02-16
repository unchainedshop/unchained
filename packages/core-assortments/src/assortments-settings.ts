import { AssortmentsSettingsOptions } from '@unchainedshop/types/assortments';
import { Db } from '@unchainedshop/types/common';
import zipTreeByDeepness from './utils/tree-zipper/zipTreeByDeepness';
import makeCache from './product-cache/mongodb';

export const assortmentsSettings = {
  zipTree: null,
  setCachedProductIds: null,
  getCachedProductIds: null,
  configureSettings: async (
    { zipTree = zipTreeByDeepness }: AssortmentsSettingsOptions = {},
    db: Db,
  ) => {
    const { setCachedProductIds, getCachedProductIds } = await makeCache(db);
    assortmentsSettings.zipTree = zipTree;
    assortmentsSettings.setCachedProductIds = setCachedProductIds;
    assortmentsSettings.getCachedProductIds = getCachedProductIds;
  },
};
