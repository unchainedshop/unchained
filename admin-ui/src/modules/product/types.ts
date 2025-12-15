import {
  IProductStatus,
  IProductType,
  IProductVariationType,
} from '../../gql/types';

export type ProductVariationOptionCSVRow = {
  value: string;
  variationId: string;
};

export type ProductVariationCSVRow = {
  productId: string;
  variationId: string;
  key: string;
  type: IProductVariationType;
  [key: string]: any;
};

export type ProductPriceCSVRow = {
  productId: string;
  amount: string;
  maxQuantity: string;
  isTaxable?: string;
  isNetPrice?: string;
  currencyCode: string;
  countryCode: string;
};

export type ProductBundleItemsCSVRow = {
  productId: string;
  bundleItemProductId: string;
  quantity?: string;
  configuration: string;
};

export type ProductCSVRow = {
  _id: string;
  type: IProductType;
  sequence: string | number;
  status?: IProductStatus;
  published?: string;
  tags: string | string[];
  warehousing?: {
    sku: string;
    baseUnit: string;
  };
  supply?: {
    weightInGram?: number;
    heightInMillimeters?: number;
    lengthInMillimeters?: number;
    widthInMillimeters?: number;
  };
  [key: string]: any;
};

export interface ProductImportPayload {
  productsCSV: ProductCSVRow[];
  bundleItemsCSV: ProductBundleItemsCSVRow[];
  variationsCSV: ProductVariationCSVRow[];
  variationOptionsCSV: ProductVariationOptionCSVRow[];
  pricesCSV: ProductPriceCSVRow[];
}

export interface ProductPayload {
  _id: string;
  type: IProductType;
  sequence: string;
  status?: string;
  published?: string;
  tags: string;
  warehousing?: {
    sku: string;
    baseUnit: string;
  };
  supply?: {
    weightInGram?: string;
    heightInMillimeters?: string;
    lengthInMillimeters?: string;
    widthInMillimeters?: string;
  };

  [key: string]: any;
}

export type ProductCSVFileKey =
  | 'productsCSV'
  | 'pricesCSV'
  | 'bundleItemsCSV'
  | 'variationsCSV'
  | 'variationOptionsCSV';

export type BuildProductEventsParam = ProductCSVRow & {
  commerce: ProductPriceCSVRow[];
  bundleItems: ProductBundleItemsCSVRow[];
  variations: ProductVariationCSVRow[];
};
