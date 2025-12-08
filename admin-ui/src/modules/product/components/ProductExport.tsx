import React, { useCallback, useState } from 'react';
import Button from '../../common/components/Button';
import { fetchTranslatedTextsForAllProducts } from '../utils/fetchTranslatedTextsForAllProducts';
import { useCSVExport } from '../../common/hooks/useCSVExport';
import useProducts from '../hooks/useProducts';
import useApp from '../../common/hooks/useApp';
import { useIntl } from 'react-intl';

const PRODUCT_SCHEMA = {
  base: [
    '_id',
    'sku',
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
};

const buildHeaders = (locales) => [
  ...PRODUCT_SCHEMA.base,
  ...locales.flatMap((locale) =>
    PRODUCT_SCHEMA.textFields.map((field) => `texts.${locale}.${field}`),
  ),
];

const ProductExport = () => {
  const { products, loading, client } = useProducts({ limit: 10000 });
  const { languageDialectList } = useApp();
  const { formatMessage } = useIntl();
  const [loadingTranslations, setLoadingTranslations] = useState(false);

  const locales = languageDialectList?.map(({ isoCode }) => isoCode) || [];
  const headers = buildHeaders(locales);

  const extractRow = useCallback((product) => product, [locales]);

  const { exportCSV, isExporting } = useCSVExport(products, extractRow, {
    headers,
  });

  const handleExport = useCallback(async () => {
    setLoadingTranslations(true);

    const map = await fetchTranslatedTextsForAllProducts(products, client);

    setLoadingTranslations(false);

    const extractRowWithMap = (product) => {
      const row: any = {};

      PRODUCT_SCHEMA.base.forEach((key) => {
        row[key] = product[key] ?? '';
      });

      const translations = map[product._id] || [];
      locales.forEach((locale) => {
        const text = translations.find((t) => t.locale === locale) ?? {};
        PRODUCT_SCHEMA.textFields.forEach((field) => {
          let val = text[field];
          if (Array.isArray(val)) val = val.join(';');
          row[`texts.${locale}.${field}`] = val || '';
        });
      });

      return row;
    };
    exportCSV('products_export', products.map(extractRowWithMap));
  }, [products, client, exportCSV, locales]);

  if (loading) return null;

  return (
    <Button
      onClick={handleExport}
      disabled={isExporting || loadingTranslations || !products.length}
      variant="secondary"
      text={
        loadingTranslations
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
