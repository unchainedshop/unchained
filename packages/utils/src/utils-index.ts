export * as calculation from './calculation.ts';
export * as ch from './ch/index.ts';

export * from './locale-helpers.ts';
export { default as objectInvert } from './object-invert.ts';
export { default as findUnusedSlug } from './find-unused-slug.ts';
export { default as slugify } from './slugify.ts';
export { default as generateRandomHash } from './generate-random-hash.ts';
export { default as buildObfuscatedFieldsFilter } from './build-obfuscated-fields-filter.ts';
export { default as sha256 } from './sha256.ts';
export { default as sha1 } from './sha1.ts';
export { timingSafeEqual, timingSafeStringEqual } from './timing-safe-equal.ts';

export const SortDirection = {
  ASC: 'ASC',
  DESC: 'DESC',
} as const;

export type SortDirection = (typeof SortDirection)[keyof typeof SortDirection];

export interface SortOption {
  key: string;
  value: SortDirection;
}

export interface Price {
  amount: number;
  currencyCode: string;
}

export interface PricingCalculation {
  category: string;
  amount: number;
  baseCategory?: string;
  meta?: any;
}

export type NodeOrTree<T> = string | Tree<T>;

export type Tree<T> = NodeOrTree<T>[];

export interface DateFilterInput {
  start?: string;
  end?: string;
}

export * from './director/BaseAdapter.ts';
export * from './director/BaseDirector.ts';
