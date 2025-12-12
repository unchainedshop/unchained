import React, { useCallback, useState, useMemo } from 'react';
import Button from '../../common/components/Button';
import { fetchTranslatedTextsForAllProducts } from '../utils/fetchTranslatedTextsForAllProducts';
import { useCSVExport } from '../../common/hooks/useCSVExport';
import useProducts from '../hooks/useProducts';
import useApp from '../../common/hooks/useApp';
import { useIntl } from 'react-intl';
import { IProduct } from '../../../gql/types';
import { PRODUCT_TYPES } from '../ProductTypes';

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
  bundleItemHeaders: ['productId', 'bundleItemProductId', 'quantity'],
};

const buildHeaders = (locales: string[]) => [
  ...PRODUCT_SCHEMA.base,
  ...locales.flatMap((locale) =>
    PRODUCT_SCHEMA.textFields.map((field) => `texts.${locale}.${field}`),
  ),
  'supply.weightInGram',
  'supply.heightInMillimeters',
  'supply.lengthInMillimeters',
  'supply.widthInMillimeters',
];

const buildProductPriceHeaders = () => [...PRODUCT_SCHEMA.priceFields];
const buildProductBundleItemsHeaders = () => [
  ...PRODUCT_SCHEMA.bundleItemHeaders,
];

const ProductExport = ({ queryString, includeDrafts, tags, sort }) => {
  const { products, loading, client } = useProducts({
    limit: 0,
    queryString,
    includeDrafts,
    tags,
    sort,
  });
  const { languageDialectList } = useApp();
  const { formatMessage } = useIntl();

  const [isLoadingTranslations, setIsLoadingTranslations] = useState(false);

  const locales = useMemo(
    () => languageDialectList?.map((l) => l.isoCode) ?? [],
    [languageDialectList],
  );

  const headersBase = useMemo(() => buildHeaders(locales), [locales]);
  const priceHeaders = useMemo(() => buildProductPriceHeaders(), []);
  const bundleItemsHeaders = useMemo(
    () => buildProductBundleItemsHeaders(),
    [],
  );

  const { exportCSV, isExporting } = useCSVExport(products, (p) => p, {
    headers: headersBase,
  });
  const { exportCSV: exportPricesCSV } = useCSVExport(products, (p) => p, {
    headers: priceHeaders,
  });

  const { exportCSV: exportBundleItemsCSV } = useCSVExport(products, (p) => p, {
    headers: bundleItemsHeaders,
  });

  const handleExport = useCallback(async () => {
    setIsLoadingTranslations(true);

    const translationMap = await fetchTranslatedTextsForAllProducts(
      products as IProduct[],
      client,
    );
    setIsLoadingTranslations(false);

    const translations = {};
    for (const productId in translationMap.products) {
      translations[productId] = {};
      for (const t of translationMap.products[productId]) {
        translations[productId][t.locale] = t;
      }
    }
    const productPricesRows: Record<string, any>[] = [];
    const productBundleItemRows: Record<string, any>[] = [];
    const productsRows = products.map(({ ...product }) => {
      const row: Record<string, any> = {};
      const prices = translationMap?.prices[product._id] ?? [];
      prices.forEach((pRow) => {
        productPricesRows.push({
          productId: product._id,
          amount: pRow['amount'] ?? '',
          isNetPrice: pRow['isNetPrice'] ?? '',
          isTaxable: pRow['isTaxable'] ?? '',
          currencyCode: pRow.currency.isoCode,
          countryCode: pRow.country.isoCode,
        });
      });

      const bundles = translationMap?.bundles[product._id] ?? [];
      bundles.forEach((bRow) => {
        productBundleItemRows.push({
          productId: product._id,
          bundleItemProductId: bRow.product._id,
          quantity: bRow.quantity ?? 1,
          configuration: Object.entries(bRow.configuration || [])
            .map(([key, value]) => `${key}:${value}`)
            .join(';'),
        });
      });

      PRODUCT_SCHEMA.base.forEach((key) => {
        if (key === '__typename') row[key] = PRODUCT_TYPES[product[key]];
        else row[key] = product[key] ?? '';
      });

      row['supply.weightInGram'] = (product as any)?.dimensions?.weight ?? '';
      row['supply.heightInMillimeters'] =
        (product as any)?.dimensions?.height ?? '';
      row['supply.lengthInMillimeters'] =
        (product as any)?.dimensions?.length ?? '';
      row['supply.widthInMillimeters'] =
        (product as any)?.dimensions?.width ?? '';

      const productTexts = translations[product._id] || {};

      locales.forEach((locale) => {
        const text = productTexts[locale] || {};

        PRODUCT_SCHEMA.textFields.forEach((field) => {
          let value = text[field];

          if (Array.isArray(value)) value = value.join(';');

          row[`texts.${locale}.${field}`] = value ?? '';
        });
      });

      return row;
    });

    exportCSV('products_export', productsRows);
    exportPricesCSV('products_prices_export', productPricesRows);
    exportBundleItemsCSV('products_bundle_items_export', productBundleItemRows);
  }, [products, client, exportCSV, locales]);

  if (loading) return null;

  return (
    <Button
      onClick={handleExport}
      disabled={isExporting || isLoadingTranslations || !products.length}
      variant="secondary"
      text={
        isLoadingTranslations
          ? formatMessage({
              id: 'loading_translations',
              defaultMessage: 'Loading translations...',
            })
          : isExporting
            ? formatMessage({ id: 'exporting', defaultMessage: 'Exporting...' })
            : formatMessage({ id: 'export', defaultMessage: 'Export' })
      }
    />
  );
};

export default ProductExport;
