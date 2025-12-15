import React, { useCallback, useRef, useState } from 'react';
import Button from '../../common/components/Button';
import parseCSV from 'papaparse';
import { useIntl } from 'react-intl';
import { CSVRow, downloadCSV } from '../../common/utils/csvUtils';
import { ProductCSVFileKey, ProductImportPayload } from '../types';
import {
  buildBundleHeaders,
  buildPriceHeaders,
  buildProductHeaders,
  buildVariationHeaders,
  buildVariationOptionsHeaders,
  PRODUCT_CSV_SCHEMA,
} from '../hooks/useProductExport';
import useApp from '../../common/hooks/useApp';

interface FileConfig {
  key: ProductCSVFileKey;
  label: string;
  optional?: boolean;
}

const REQUIRED_FIELDS: Record<ProductCSVFileKey, string[]> = {
  productsCSV: PRODUCT_CSV_SCHEMA.base,
  pricesCSV: PRODUCT_CSV_SCHEMA.priceFields,
  bundleItemsCSV: PRODUCT_CSV_SCHEMA.bundleItemHeaders,
  variationOptionsCSV: PRODUCT_CSV_SCHEMA.variationOptionItemHeaders,
  variationsCSV: PRODUCT_CSV_SCHEMA.variationItemHeaders,
};

export const getFilterCSVHeaders = (
  key: ProductCSVFileKey,
  locales: string[] = [],
) => {
  if (key === 'productsCSV') return buildProductHeaders(locales);
  if (key === 'bundleItemsCSV') return buildBundleHeaders();
  if (key === 'pricesCSV') return buildPriceHeaders();
  if (key === 'variationsCSV') return buildVariationHeaders(locales);
  if (key === 'variationOptionsCSV')
    return buildVariationOptionsHeaders(locales);

  return [];
};

const downloadCSVTemplate = (
  key: ProductCSVFileKey,
  fileName: string,
  locales: string[] = [],
) => {
  const headers = getFilterCSVHeaders(key, locales).join(',');
  downloadCSV(headers, fileName);
};

const ProductImportForm = ({
  onImport,
}: {
  onImport: (files: ProductImportPayload) => Promise<void>;
}) => {
  const fileRefs = useRef<Partial<Record<ProductCSVFileKey, HTMLInputElement>>>(
    {},
  );
  const { formatMessage } = useIntl();
  const { languageDialectList } = useApp();
  const locales = languageDialectList?.map((l) => l.isoCode) || [];

  const [errors, setErrors] = useState<
    Partial<Record<ProductCSVFileKey, string>>
  >({});
  const [fileData, setFileData] = useState<ProductImportPayload>({
    productsCSV: [],
    pricesCSV: [],
    bundleItemsCSV: [],
    variationsCSV: [],
    variationOptionsCSV: [],
  });
  const [isImporting, setIsImporting] = useState(false);

  const FILES: FileConfig[] = [
    {
      key: 'productsCSV',
      label: formatMessage({
        id: 'product_csv_file',
        defaultMessage: 'Products CSV',
      }),
    },
    {
      key: 'pricesCSV',
      label: formatMessage({
        id: 'product_price_csv_file',
        defaultMessage: 'Product prices CSV (Optional)',
      }),
      optional: true,
    },
    {
      key: 'bundleItemsCSV',
      label: formatMessage({
        id: 'product_bundle_item_csv_file',
        defaultMessage: 'Product bundle items CSV (Optional)',
      }),
      optional: true,
    },
    {
      key: 'variationsCSV',
      label: formatMessage({
        id: 'product_variations_csv_file',
        defaultMessage: 'Product variations CSV (Optional)',
      }),
      optional: true,
    },
    {
      key: 'variationOptionsCSV',
      label: formatMessage({
        id: 'product_variation_options_csv_file',
        defaultMessage: 'Product variation options CSV (Optional)',
      }),
      optional: true,
    },
  ];

  const parseFile = async (file: File) => {
    const text = await file.text();
    const result = parseCSV.parse(text, { header: true, skipEmptyLines: true });
    return result.data as CSVRow[];
  };

  const validateCSV = (key: ProductCSVFileKey, rows: CSVRow[]) => {
    if (!rows.length) return false;
    const headers = Object.keys(rows[0]);
    const missing = REQUIRED_FIELDS[key].filter((f) => !headers.includes(f));
    if (missing.length) {
      setErrors((prev) => ({
        ...prev,
        [key]: formatMessage(
          {
            id: 'csv_missing_fields',
            defaultMessage: 'Missing required columns: {fields}',
          },
          { fields: missing.join(', ') },
        ),
      }));
      return false;
    }
    setErrors((prev) => ({ ...prev, [key]: undefined }));
    return true;
  };

  const handleFileChange = async (key: ProductCSVFileKey, file?: File) => {
    if (!file) return;
    const data = await parseFile(file);
    const isValid = validateCSV(key, data);
    setFileData((prev) => ({ ...prev, [key]: isValid ? data : [] }));
  };

  const handleInputChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    key: ProductCSVFileKey,
  ) => {
    const file = e.target.files?.[0];
    await handleFileChange(key, file);
    e.target.value = '';
  };

  const handleImport = useCallback(async () => {
    setIsImporting(true);
    try {
      await onImport(fileData);
    } finally {
      setIsImporting(false);
    }
  }, [fileData, onImport]);

  const isProductsSelected = fileData.productsCSV.length > 0;
  const hasErrors = Object.values(errors).some(Boolean);

  return (
    <div className="sm:max-w-full w-full max-w-xl mx-auto p-6  bg-white border border-gray-200 rounded-lg shadow-md flex flex-col gap-6">
      <h3 className="text-center text-lg font-semibold">
        {formatMessage({
          id: 'products_import_title',
          defaultMessage: 'Import Products',
        })}
      </h3>
      <p className="text-center text-sm text-gray-600">
        {formatMessage({
          id: 'product_import_description',
          defaultMessage:
            'Select your products CSV and optional CSV files, then click Import.',
        })}
      </p>

      {FILES.map(({ key, label, optional }) => (
        <div key={key} className="flex flex-col gap-2">
          <input
            ref={(el) => {
              fileRefs.current[key] = el ?? null;
            }}
            type="file"
            accept=".csv"
            onChange={(e) => handleInputChange(e, key)}
            className="hidden"
          />

          <div className="flex justify-between items-center gap-2">
            <Button
              text={
                fileData[key].length
                  ? formatMessage({
                      id: `${key}_file_selected`,
                      defaultMessage: `${label} Selected`,
                    })
                  : formatMessage({
                      id: `select_${key}`,
                      defaultMessage: `Select ${label}`,
                    })
              }
              onClick={() => fileRefs.current[key]?.click()}
              variant="secondary"
              className="flex-1"
              disabled={isImporting || (!isProductsSelected && optional)}
            />

            <button
              type="button"
              className="text-xs text-blue-600 hover:underline"
              title="Download a CSV template with required columns"
              onClick={() =>
                downloadCSVTemplate(key, `${key}_template.csv`, locales)
              }
            >
              {formatMessage({
                id: 'download_csv_template',
                defaultMessage: 'Download template',
              })}
            </button>
          </div>
          {errors[key] && (
            <p className="text-red-600 text-xs flex items-center gap-1">
              ⚠ {errors[key]}
            </p>
          )}
        </div>
      ))}

      <Button
        text={isImporting ? 'Importing…' : 'Import'}
        onClick={handleImport}
        disabled={isImporting || !isProductsSelected || hasErrors}
        variant="primary"
        className="w-full flex justify-center items-center gap-2"
      >
        {isImporting && (
          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        )}
      </Button>

      {isProductsSelected && !hasErrors && (
        <p className="text-center text-xs text-gray-500">
          {formatMessage(
            {
              id: 'ready_to_import',
              defaultMessage:
                'Ready to import {products} products{prices}{bundleItems}{variations}{variationOptions}.',
            },
            {
              products: fileData.productsCSV.length,
              prices: fileData.pricesCSV.length
                ? ` with ${fileData.pricesCSV.length} prices`
                : '',
              bundleItems: fileData.bundleItemsCSV.length
                ? ` with ${fileData.bundleItemsCSV.length} bundle items`
                : '',
              variations: fileData.variationsCSV.length
                ? ` with ${fileData.variationsCSV.length} variations`
                : '',
              variationOptions: fileData.variationOptionsCSV.length
                ? ` with ${fileData.variationOptionsCSV.length} variation options`
                : '',
            },
          )}
        </p>
      )}
    </div>
  );
};

export default ProductImportForm;
