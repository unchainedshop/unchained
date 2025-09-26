import { slugify as defaultSlugify, Tree } from '@unchainedshop/utils';
import zipTreeByDeepness from './utils/tree-zipper/zipTreeByDeepness.js';
import makeMongoDBCache from './product-cache/mongodb.js';
import { mongodb } from '@unchainedshop/mongodb';

export interface AssortmentsSettings {
  zipTree: (data: Tree<string>) => string[];
  slugify: (title: string) => string;
  setCachedProductIds: (assortmentId: string, productIds: string[]) => Promise<number>;
  getCachedProductIds: (assortmentId: string) => Promise<string[] | undefined>;
  configureSettings: (options: AssortmentsSettingsOptions, db: mongodb.Db) => void;
}

export type AssortmentsSettingsOptions = Partial<Omit<AssortmentsSettings, 'configureSettings'>>;

export const assortmentsSettings: AssortmentsSettings = {
  setCachedProductIds: () => Promise.resolve(0),
  getCachedProductIds: () => Promise.resolve(undefined),
  zipTree: zipTreeByDeepness,
  slugify: defaultSlugify,
  configureSettings: async (
    {
      setCachedProductIds,
      getCachedProductIds,
      zipTree,
      slugify,
    }: Partial<Omit<AssortmentsSettingsOptions, 'configureSettings'>>,
    db: mongodb.Db,
  ) => {
    const defaultCache = await makeMongoDBCache(db);
    assortmentsSettings.zipTree = zipTree || zipTreeByDeepness;
    assortmentsSettings.slugify = slugify || defaultSlugify;
    assortmentsSettings.setCachedProductIds = setCachedProductIds || defaultCache.setCachedProductIds;
    assortmentsSettings.getCachedProductIds = getCachedProductIds || defaultCache.getCachedProductIds;
  },
};
