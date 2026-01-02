import { useCallback, useState } from 'react';
import { useCSVExport } from '../../common/hooks/useCSVExport';

export const PRODUCT_CSV_SCHEMA = {
  base: [
    '_id',
    'sku',
    'baseUnit',
    'sequence',
    'status',
    'tags',
    'updated',
    'published',
    'type',
  ],
  textFields: [
    'title',
    'subtitle',
    'description',
    'vendor',
    'brand',
    'labels',
    'slug',
  ],
  priceFields: [
    'productId',
    'amount',
    'currencyCode',
    'countryCode',
    'isTaxable',
    'isNetPrice',
    'maxQuantity',
  ],
  bundleItemHeaders: [
    'productId',
    'bundleItemProductId',
    'quantity',
    'configuration',
  ],
  variationItemHeaders: ['productId', 'variationId', 'key', 'type'],
  variationTextFields: ['title', 'subtitle'],
  variationOptionItemHeaders: ['variationId', 'value'],
  variationOptionTextFields: ['title', 'subtitle'],
};

export const buildProductHeaders = (locales: string[]) => [
  ...PRODUCT_CSV_SCHEMA.base,
  ...locales.flatMap((locale) =>
    PRODUCT_CSV_SCHEMA.textFields.map((field) => `texts.${locale}.${field}`),
  ),
  'supply.weightInGram',
  'supply.heightInMillimeters',
  'supply.lengthInMillimeters',
  'supply.widthInMillimeters',
];

export const buildPriceHeaders = () => [...PRODUCT_CSV_SCHEMA.priceFields];
export const buildBundleHeaders = () => [
  ...PRODUCT_CSV_SCHEMA.bundleItemHeaders,
];
export const buildVariationHeaders = (locales) => [
  ...PRODUCT_CSV_SCHEMA.variationItemHeaders,
  ...locales.flatMap((locale) =>
    PRODUCT_CSV_SCHEMA.variationTextFields.map(
      (field) => `texts.${locale}.${field}`,
    ),
  ),
];

export const buildVariationOptionsHeaders = (locales) => [
  ...PRODUCT_CSV_SCHEMA.variationOptionItemHeaders,
  ...locales.flatMap((locale) =>
    PRODUCT_CSV_SCHEMA.variationOptionTextFields.map(
      (field) => `texts.${locale}.${field}`,
    ),
  ),
];
export const useProductExport = () => {
  const { exportCSV: exportProductsCSV, isExporting } = useCSVExport((p) => p);
  const exportProducts = useCallback(async (data) => {
    await exportProductsCSV({ type: 'PRODUCTS', ...data });
  }, []);

  return {
    exportProducts,
    isLoading: isExporting,
  };
};
