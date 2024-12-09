export * as calculation from './calculation.js';

export * from './locale-helpers.js';
export { default as objectInvert } from './object-invert.js';
export { default as findUnusedSlug } from './find-unused-slug.js';
export { default as slugify } from './slugify.js';
export { default as pipePromises } from './pipe-promises.js';
export { default as generateRandomHash } from './generate-random-hash.js';
export { default as randomValueHex } from './random-value-hex.js';
export { default as buildObfuscatedFieldsFilter } from './build-obfuscated-fields-filter.js';
export { default as sha256 } from './sha256.js';

/*
 * Schemas
 */

export enum SortDirection {
  ASC = 'ASC',
  DESC = 'DESC',
}

export type SortOption = {
  key: string;
  value: SortDirection;
};

export type Price = { _id?: string; amount: number; currency: string };

export interface PricingCalculation {
  category: string;
  amount: number;
  baseCategory?: string;
  meta?: any;
}

export type NodeOrTree<T> = string | Tree<T>; // eslint-disable-line
export type Tree<T> = Array<NodeOrTree<T>>;
/*
 * Director
 */

export * from './director/BaseAdapter.js';
export * from './director/BaseDirector.js';
