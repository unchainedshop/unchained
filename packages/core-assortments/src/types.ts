import { mongodb, TimestampFields } from '@unchainedshop/mongodb';

export type AssortmentMediaType = {
  _id?: string;
  mediaId: string;
  assortmentId: string;
  sortKey: number;
  tags: Array<string>;
  meta?: any;
} & TimestampFields;

export type AssortmentMediaText = {
  _id?: string;
  assortmentMediaId: string;
  locale?: string;
  title?: string;
  subtitle?: string;
} & TimestampFields;

export type Assortment = {
  _id?: string;
  isActive: boolean;
  isBase: boolean;
  isRoot: boolean;
  meta?: any;
  sequence: number;
  slugs: Array<string>;
  tags: Array<string>;
} & TimestampFields;

export type AssortmentFilter = {
  _id?: string;
  assortmentId: string;
  filterId: string;
  meta?: any;
  sortKey: number;
  tags: Array<string>;
} & TimestampFields;

export type AssortmentLink = {
  _id?: string;
  childAssortmentId: string;
  meta?: any;
  parentAssortmentId: string;
  sortKey: number;
  tags: Array<string>;
} & TimestampFields;

export type AssortmentProduct = {
  _id?: string;
  assortmentId: string;
  meta?: any;
  productId: string;
  sortKey: number;
  tags: Array<string>;
} & TimestampFields;

export type AssortmentProductIdCacheRecord = {
  _id?: string;
  productIds: Array<string>;
} & TimestampFields;

export type AssortmentText = {
  _id?: string;
  assortmentId: string;
  description?: string;
  locale: string;
  slug?: string;
  subtitle?: string;
  title?: string;
} & TimestampFields;

export type AssortmentQuery = {
  queryString?: string;
  assortmentIds?: Array<string>;
  assortmentSelector?: mongodb.Filter<Assortment>;
  includeInactive?: boolean;
  includeLeaves?: boolean;
  slugs?: Array<string>;
  tags?: Array<string>;
};

export interface AssortmentPathLink {
  assortmentId: string;
  childAssortmentId: string;
  parentIds: string[];
}

export type InvalidateCacheFn = (
  params: AssortmentQuery,
  options?: { skipUpstreamTraversal: boolean },
) => void;
