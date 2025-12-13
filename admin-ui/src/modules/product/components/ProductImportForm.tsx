import React, { useCallback, useRef, useState } from 'react';
import Button from '../../common/components/Button';
import parseCSV from 'papaparse';
import { useIntl } from 'react-intl';
import { CSVRow } from '../../common/utils/csvUtils';

type CSVFileKey =
  | 'productsCSV'
  | 'pricesCSV'
  | 'bundleItemsCSV'
  | 'variationsCSV'
  | 'variationOptionsCSV';

interface FileConfig {
  key: CSVFileKey;
  label: string;
  optional?: boolean;
}

const ProductImportForm = ({
  onImport,
}: {
  onImport: (files: Record<CSVFileKey, CSVRow[]>) => Promise<void>;
}) => {
  const fileRefs = useRef<Partial<Record<CSVFileKey, HTMLInputElement>>>({});
  const [fileData, setFileData] = useState<Record<CSVFileKey, CSVRow[]>>({
    productsCSV: [],
    pricesCSV: [],
    bundleItemsCSV: [],
    variationsCSV: [],
    variationOptionsCSV: [],
  });
  const [isImporting, setIsImporting] = useState(false);
  const { formatMessage } = useIntl();

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

  const handleFileChange = async (key: CSVFileKey, file?: File) => {
    if (!file) return;
    const data = await parseFile(file);
    setFileData((prev) => ({ ...prev, [key]: data }));
  };

  const handleInputChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    key: CSVFileKey,
  ) => {
    const file = e.target.files?.[0];
    await handleFileChange(key, file);
    e.target.value = '';
  };

  const handleImport = useCallback(async () => {
    setIsImporting(true);
    try {
      await onImport(fileData);
    } catch (err: any) {
      console.error('Error importing products:', err);
    } finally {
      setIsImporting(false);
    }
  }, [fileData, onImport]);

  const isProductsSelected = fileData.productsCSV.length > 0;

  return (
    <div className="max-w-md mx-auto p-6 bg-gray-50 border border-gray-200 rounded-lg flex flex-col gap-4">
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
            'Select your products CSV and optional Product prices & bundle items CSV, then click Import.',
        })}
      </p>

      {FILES.map(({ key, label, optional }) => (
        <React.Fragment key={key}>
          <input
            ref={(el) => {
              fileRefs.current[key] = el ?? null;
            }}
            type="file"
            accept=".csv"
            onChange={(e) => handleInputChange(e, key)}
            className="hidden"
          />

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
            disabled={isImporting || (!isProductsSelected && optional)}
            className="w-full"
          />
        </React.Fragment>
      ))}

      <Button
        text={
          isImporting
            ? formatMessage({ id: 'importing', defaultMessage: 'Importing...' })
            : formatMessage({ id: 'import', defaultMessage: 'Import' })
        }
        onClick={handleImport}
        disabled={isImporting || !isProductsSelected}
        variant="primary"
        className="w-full"
      />

      {isProductsSelected && (
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
                ? ` with ${fileData.variationOptionsCSV.length} Variation options`
                : '',
            },
          )}
        </p>
      )}
    </div>
  );
};

export default ProductImportForm;
