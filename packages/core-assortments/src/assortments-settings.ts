import { slugify as defaultSlugify, type Tree } from '@unchainedshop/utils';
import { type DrizzleDb } from '@unchainedshop/store';
import zipTreeByDeepness from './utils/tree-zipper/zipTreeByDeepness.ts';
import makeDrizzleCache from './product-cache/drizzle.ts';

export interface AssortmentsSettings {
  zipTree: (data: Tree<string>) => string[];
  slugify: (title: string) => string;
  setCachedProductIds: (assortmentId: string, productIds: string[]) => Promise<number>;
  getCachedProductIds: (assortmentId: string) => Promise<string[] | undefined>;
  configureSettings: (options: AssortmentsSettingsOptions, db: DrizzleDb) => void;
}

export type AssortmentsSettingsOptions = Omit<Partial<AssortmentsSettings>, 'configureSettings'>;

export const assortmentsSettings: AssortmentsSettings = {
  setCachedProductIds: () => Promise.resolve(0),
  getCachedProductIds: () => Promise.resolve(undefined),
  zipTree: zipTreeByDeepness,
  slugify: defaultSlugify,
  configureSettings: (
    {
      setCachedProductIds,
      getCachedProductIds,
      zipTree,
      slugify,
    }: Partial<Omit<AssortmentsSettingsOptions, 'configureSettings'>>,
    db: DrizzleDb,
  ) => {
    const defaultCache = makeDrizzleCache(db);
    assortmentsSettings.zipTree = zipTree || zipTreeByDeepness;
    assortmentsSettings.slugify = slugify || defaultSlugify;
    assortmentsSettings.setCachedProductIds = setCachedProductIds || defaultCache.setCachedProductIds;
    assortmentsSettings.getCachedProductIds = getCachedProductIds || defaultCache.getCachedProductIds;
  },
};
