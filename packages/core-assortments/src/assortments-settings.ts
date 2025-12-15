import { slugify as defaultSlugify, type Tree } from '@unchainedshop/utils';
import { type Database } from '@unchainedshop/sqlite';
import zipTreeByDeepness from './utils/tree-zipper/zipTreeByDeepness.ts';
import makeSqliteCache from './product-cache/sqlite.ts';

export interface AssortmentsSettings {
  zipTree: (data: Tree<string>) => string[];
  slugify: (title: string) => string;
  setCachedProductIds: (assortmentId: string, productIds: string[]) => Promise<number>;
  getCachedProductIds: (assortmentId: string) => Promise<string[] | undefined>;
  configureSettings: (options: AssortmentsSettingsOptions, db?: Database) => void;
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
    db?: Database,
  ) => {
    const defaultCache = db ? makeSqliteCache(db) : null;
    assortmentsSettings.zipTree = zipTree || zipTreeByDeepness;
    assortmentsSettings.slugify = slugify || defaultSlugify;
    assortmentsSettings.setCachedProductIds =
      setCachedProductIds || defaultCache?.setCachedProductIds || (() => Promise.resolve(0));
    assortmentsSettings.getCachedProductIds =
      getCachedProductIds || defaultCache?.getCachedProductIds || (() => Promise.resolve(undefined));
  },
};
