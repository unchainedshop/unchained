// Bulk Import Event Types

export type BulkImportEntity = 'PRODUCT' | 'ASSORTMENT' | 'FILTER';
export type BulkImportOperation = 'CREATE' | 'UPDATE' | 'REMOVE';

export interface BulkImportEvent<T = unknown> {
  entity: BulkImportEntity;
  operation: BulkImportOperation;
  payload: T;
}

export interface BulkImportPayload {
  events: BulkImportEvent[];
}

// Localized Content
export interface LocalizedContent {
  title?: string;
  subtitle?: string;
  slug?: string;
  description?: string;
}

export interface ProductLocalizedContent extends LocalizedContent {
  brand?: string;
  vendor?: string;
  labels?: string[];
}

// Product Types
export type ProductType =
  | 'SIMPLE_PRODUCT'
  | 'CONFIGURABLE_PRODUCT'
  | 'BUNDLE_PRODUCT'
  | 'PLAN_PRODUCT'
  | 'TOKENIZED_PRODUCT';

export interface ProductPricing {
  amount: number;
  currencyCode: string;
  countryCode: string;
  maxQuantity?: number;
  isTaxable?: boolean;
  isNetPrice?: boolean;
}

export interface ProductCommerce {
  pricing: ProductPricing[];
  salesUnit?: string;
  salesQuantityPerUnit?: string;
  defaultOrderQuantity?: number;
}

export interface ProductWarehousing {
  sku?: string;
  baseUnit?: string;
}

export interface ProductSupply {
  weightInGram?: number;
  heightInMillimeters?: number;
  lengthInMillimeters?: number;
  widthInMillimeters?: number;
}

export interface ProductSpecification {
  type: ProductType;
  sequence: number;
  status?: string | null;
  published?: string | null;
  tags?: string[];
  commerce?: ProductCommerce;
  warehousing?: ProductWarehousing;
  supply?: ProductSupply;
  meta?: Record<string, unknown>;
  content: Record<string, ProductLocalizedContent>;
}

export interface ProductPayload {
  _id: string;
  specification: ProductSpecification;
}

// Assortment Types
export interface AssortmentProduct {
  productId: string;
  tags?: string[];
  sortKey?: number;
  meta?: Record<string, unknown>;
}

export interface AssortmentChild {
  assortmentId: string;
  tags?: string[];
  sortKey?: number;
  meta?: Record<string, unknown>;
}

export interface AssortmentFilter {
  filterId: string;
  tags?: string[];
  sortKey?: number;
  meta?: Record<string, unknown>;
}

export interface AssortmentSpecification {
  isActive: boolean;
  isRoot?: boolean;
  sequence: number;
  tags?: string[];
  meta?: Record<string, unknown>;
  content: Record<string, LocalizedContent>;
}

export interface AssortmentPayload {
  _id: string;
  specification: AssortmentSpecification;
  products?: AssortmentProduct[];
  children?: AssortmentChild[];
  filters?: AssortmentFilter[];
}

// Filter Types
export type FilterType = 'SWITCH' | 'SINGLE_CHOICE' | 'MULTI_CHOICE' | 'RANGE';

export interface FilterOption {
  value: string;
  content?: Record<string, LocalizedContent>;
}

export interface FilterSpecification {
  type: FilterType;
  key: string;
  isActive?: boolean;
  options?: FilterOption[];
  meta?: Record<string, unknown>;
  content: Record<string, LocalizedContent>;
}

export interface FilterPayload {
  _id: string;
  specification: FilterSpecification;
}

// CLI Configuration
export interface CLIOptions {
  endpoint: string;
  token: string;
  products: number;
  chunkSize: number;
  dryRun: boolean;
  output?: string;
  verbose: boolean;
}
