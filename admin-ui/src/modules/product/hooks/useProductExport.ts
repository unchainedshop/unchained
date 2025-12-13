import { useCallback, useMemo, useState } from 'react';
import { PRODUCT_TYPES } from '../ProductTypes';
import { fetchAllProductsForExport } from '../utils/fetchAllProductsForExport';
import { useCSVExport } from '../../common/hooks/useCSVExport';
import { IProduct } from '../../../gql/types';
import useApp from '../../common/hooks/useApp';

const PRODUCT_SCHEMA = {
  base: [
    '_id',
    'sku',
    'baseUnit',
    'sequence',
    'status',
    'tags',
    'updated',
    'published',
    '__typename',
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

const buildProductHeaders = (locales: string[]) => [
  ...PRODUCT_SCHEMA.base,
  ...locales.flatMap((locale) =>
    PRODUCT_SCHEMA.textFields.map((field) => `texts.${locale}.${field}`),
  ),
  'supply.weightInGram',
  'supply.heightInMillimeters',
  'supply.lengthInMillimeters',
  'supply.widthInMillimeters',
];

const buildPriceHeaders = () => [...PRODUCT_SCHEMA.priceFields];
const buildBundleHeaders = () => [...PRODUCT_SCHEMA.bundleItemHeaders];
const buildVariationHeaders = (locales) => [
  ...PRODUCT_SCHEMA.variationItemHeaders,
  ...locales.flatMap((locale) =>
    PRODUCT_SCHEMA.variationTextFields.map(
      (field) => `texts.${locale}.${field}`,
    ),
  ),
];

const buildVariationOptionsHeaders = (locales) => [
  ...PRODUCT_SCHEMA.variationOptionItemHeaders,
  ...locales.flatMap((locale) =>
    PRODUCT_SCHEMA.variationOptionTextFields.map(
      (field) => `texts.${locale}.${field}`,
    ),
  ),
];

const mapTranslations = (translationMap: any) => {
  const all = {};
  for (const productId in translationMap.products) {
    all[productId] = {};
    for (const t of translationMap.products[productId]) {
      all[productId][t.locale] = t;
    }
  }
  return all;
};

const buildPriceRows = (productId: string, priceEntries: any[]) => {
  return priceEntries.map((p) => ({
    productId,
    amount: p.amount ?? '',
    isNetPrice: p.isNetPrice ?? '',
    isTaxable: p.isTaxable ?? '',
    currencyCode: p.currency.isoCode,
    countryCode: p.country.isoCode,
    maxQuantity: p.maxQuantity ?? '',
  }));
};

const buildBundleRows = (productId: string, bundleEntries: any[]) => {
  return bundleEntries.map((b) => ({
    productId,
    bundleItemProductId: b.product._id,
    quantity: b.quantity ?? 1,
    configuration: (b.configuration || [])
      .map((config) => Object.values(config).join(':'))
      .join(';'),
  }));
};

const buildVariationRows = (
  productId: string,
  variations: Record<string, any>,
  locales: string[],
) => {
  const variationRows: Record<string, any>[] = [];
  const variationOptionRows: Record<string, any>[] = [];

  Object.values(variations).forEach((variation) => {
    const variationRow: Record<string, any> = {
      productId,
      variationId: variation._id,
      type: variation.type,
      key: variation.key,
    };

    locales.forEach((locale) => {
      const localeData = variation[locale] ?? {};
      const texts = localeData.texts ?? {};
      const options = localeData.options ?? [];
      PRODUCT_SCHEMA.variationTextFields.forEach((field) => {
        variationRow[`texts.${locale}.${field}`] = texts[field] ?? '';
      });
      options.forEach((option) => {
        const optionRow: Record<string, any> = {
          variationId: variation._id,
          value: option?.value ?? '',
        };

        PRODUCT_SCHEMA.variationOptionTextFields.forEach((field) => {
          optionRow[`texts.${locale}.${field}`] = option?.texts?.[field] ?? '';
        });

        variationOptionRows.push(optionRow);
      });
    });

    variationRows.push(variationRow);
  });
  return {
    variationRows,
    variationOptionRows,
  };
};

const buildProductRow = (
  product: IProduct,
  locales: string[],
  translations: any,
) => {
  const row: Record<string, any> = {};

  PRODUCT_SCHEMA.base.forEach((key) => {
    row[key] =
      key === '__typename' ? PRODUCT_TYPES[product[key]] : (product[key] ?? '');
  });

  row['supply.weightInGram'] = (product as any)?.dimensions?.weight ?? '';
  row['supply.heightInMillimeters'] =
    (product as any)?.dimensions?.height ?? '';
  row['supply.lengthInMillimeters'] =
    (product as any)?.dimensions?.length ?? '';
  row['supply.widthInMillimeters'] = (product as any)?.dimensions?.width ?? '';

  const productTexts = translations[product._id] || {};

  locales.forEach((locale) => {
    const text = productTexts[locale] || {};

    PRODUCT_SCHEMA.textFields.forEach((field) => {
      const value = Array.isArray(text[field])
        ? text[field].join(';')
        : (text[field] ?? '');
      row[`texts.${locale}.${field}`] = value;
    });
  });

  return row;
};

export const useProductExport = (products: IProduct[] | any[], client: any) => {
  const { languageDialectList } = useApp();
  const locales = languageDialectList?.map((l) => l.isoCode) ?? [];
  const [isLoadingTranslations, setIsLoadingTranslations] = useState(false);

  const productHeaders = useMemo(() => buildProductHeaders(locales), [locales]);
  const priceHeaders = useMemo(buildPriceHeaders, []);
  const bundleHeaders = useMemo(buildBundleHeaders, []);
  const variationHeaders = useMemo(
    () => buildVariationHeaders(locales),
    [locales],
  );
  const variationOptionHeaders = useMemo(
    () => buildVariationOptionsHeaders(locales),
    [locales],
  );

  const { exportCSV: exportProductsCSV, isExporting } = useCSVExport(
    products,
    (p) => p,
    { headers: productHeaders },
  );

  const { exportCSV: exportPricesCSV } = useCSVExport(products, (p) => p, {
    headers: priceHeaders,
  });

  const { exportCSV: exportBundlesCSV } = useCSVExport(products, (p) => p, {
    headers: bundleHeaders,
  });

  const { exportCSV: exportVariationsCSV } = useCSVExport(products, (p) => p, {
    headers: variationHeaders,
  });

  const { exportCSV: exportVariationOptionsCSV } = useCSVExport(
    products,
    (p) => p,
    {
      headers: variationOptionHeaders,
    },
  );

  const exportProducts = useCallback(async () => {
    setIsLoadingTranslations(true);

    const map = await fetchAllProductsForExport(products, client, locales);
    setIsLoadingTranslations(false);

    const translations = mapTranslations(map);

    const productRows = [];
    const priceRows = [];
    const bundleRows = [];
    const variationRows = [];
    const variationOptionsRows = [];
    for (const product of products) {
      const pid = product._id;
      productRows.push(buildProductRow(product, locales, translations));
      priceRows.push(...buildPriceRows(pid, map.prices[pid] ?? []));
      bundleRows.push(...buildBundleRows(pid, map.bundles[pid] ?? []));
      const {
        variationRows: variations,
        variationOptionRows: variationOptions,
      } = buildVariationRows(pid, map.variations[pid] ?? [], locales);
      variationRows.push(...variations);
      variationOptionsRows.push(...variationOptions);
    }

    exportProductsCSV('products_export', productRows);
    exportPricesCSV('products_prices_export', priceRows);
    exportBundlesCSV('products_bundle_items_export', bundleRows);
    exportVariationsCSV('products_variations_export', variationRows);
    exportVariationOptionsCSV(
      'products_variation_options_export',
      variationOptionsRows,
    );
  }, [products, locales, client, exportProductsCSV]);

  return {
    exportProducts,
    isLoading: isLoadingTranslations || isExporting,
    isLoadingTranslations,
    isExporting,
    productHeaders,
    priceHeaders,
    bundleHeaders,
  };
};
