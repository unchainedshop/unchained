import React, { useCallback, useRef, useState } from 'react';
import Button from '../../common/components/Button';
import parseCSV from 'papaparse';
import { useIntl } from 'react-intl';
import { CSVRow } from '../../common/utils/csvUtils';

type CSVFileKey =
  | 'assortmentCSV'
  | 'assortmentProductsCSV'
  | 'assortmentChildrenCSV'
  | 'assortmentFiltersCSV';

interface FileConfig {
  key: CSVFileKey;
  label: string;
  optional?: boolean;
}

const AssortmentImportForm = ({
  onImport,
}: {
  onImport: (files: Record<CSVFileKey, CSVRow[]>) => Promise<void>;
}) => {
  const fileRefs = useRef<Partial<Record<CSVFileKey, HTMLInputElement>>>({});
  const [fileData, setFileData] = useState<Record<CSVFileKey, CSVRow[]>>({
    assortmentCSV: [],
    assortmentProductsCSV: [],
    assortmentChildrenCSV: [],
    assortmentFiltersCSV: [],
  });
  const [isImporting, setIsImporting] = useState(false);
  const { formatMessage } = useIntl();

  const FILES: FileConfig[] = [
    {
      key: 'assortmentCSV',
      label: formatMessage({
        id: 'assortment_csv_file',
        defaultMessage: 'Assortments CSV',
      }),
    },
    {
      key: 'assortmentProductsCSV',
      label: formatMessage({
        id: 'assortment_products_csv_file',
        defaultMessage: 'Assortment products CSV (Optional)',
      }),
      optional: true,
    },
    {
      key: 'assortmentChildrenCSV',
      label: formatMessage({
        id: 'assortment_children_csv_file',
        defaultMessage: 'Assortment children CSV (Optional)',
      }),
      optional: true,
    },
    {
      key: 'assortmentFiltersCSV',
      label: formatMessage({
        id: 'assortment_filters_csv_file',
        defaultMessage: 'Assortment filters CSV (Optional)',
      }),
      optional: true,
    },
  ];

  const parseFile = async (file: File) => {
    const text = await file.text();
    const result = parseCSV.parse(text, {
      header: true,
      skipEmptyLines: true,
    });
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
    } catch (err) {
      console.error('Error importing assortments:', err);
    } finally {
      setIsImporting(false);
    }
  }, [fileData, onImport]);

  const isBaseSelected = fileData.assortmentCSV.length > 0;

  return (
    <div className="max-w-md mx-auto p-6 bg-gray-50 border border-gray-200 rounded-lg flex flex-col gap-4">
      <h3 className="text-center text-lg font-semibold">
        {formatMessage({
          id: 'assortments_import_title',
          defaultMessage: 'Import Assortments',
        })}
      </h3>

      <p className="text-center text-sm text-gray-600">
        {formatMessage({
          id: 'assortment_import_description',
          defaultMessage:
            'Select your assortments CSV and optional related CSV files, then click Import.',
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
            disabled={isImporting || (!isBaseSelected && optional)}
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
        disabled={isImporting || !isBaseSelected}
        variant="primary"
        className="w-full"
      />

      {isBaseSelected && (
        <p className="text-center text-xs text-gray-500">
          {formatMessage(
            {
              id: 'ready_to_import_assortments',
              defaultMessage:
                'Ready to import {assortments} assortments{products}{children}{filters}.',
            },
            {
              assortments: fileData.assortmentCSV.length,
              products: fileData.assortmentProductsCSV.length
                ? ` with ${fileData.assortmentProductsCSV.length} products`
                : '',
              children: fileData.assortmentChildrenCSV.length
                ? ` with ${fileData.assortmentChildrenCSV.length} children`
                : '',
              filters: fileData.assortmentFiltersCSV.length
                ? ` with ${fileData.assortmentFiltersCSV.length} filters`
                : '',
            },
          )}
        </p>
      )}
    </div>
  );
};

export default AssortmentImportForm;
