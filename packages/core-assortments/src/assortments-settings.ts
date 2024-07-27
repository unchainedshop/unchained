import { slugify as defaultSlugify, Tree } from '@unchainedshop/utils';
import zipTreeByDeepness from './utils/tree-zipper/zipTreeByDeepness.js';
import makeMongoDBCache from './product-cache/mongodb.js';
import { mongodb } from '@unchainedshop/mongodb';

/*
 * Settings
 */

export interface AssortmentsSettingsOptions {
  zipTree?: (data: Tree<string>) => Array<string>;
  slugify?: (title: string) => string;
  setCachedProductIds?: (assortmentId: string, productIds: Array<string>) => Promise<number>;
  getCachedProductIds?: (assortmentId: string) => Promise<Array<string>>;
}

export interface AssortmentsSettings {
  zipTree?: (data: Tree<string>) => Array<string>;
  slugify?: (title: string) => string;
  setCachedProductIds?: (assortmentId: string, productIds: Array<string>) => Promise<number>;
  getCachedProductIds?: (assortmentId: string) => Promise<Array<string>>;
  configureSettings: (options: AssortmentsSettingsOptions, db: mongodb.Db) => void;
}

export const assortmentsSettings: AssortmentsSettings = {
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
