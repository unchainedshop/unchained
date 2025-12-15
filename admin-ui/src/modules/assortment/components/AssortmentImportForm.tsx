import React, { useCallback, useRef, useState } from 'react';
import Button from '../../common/components/Button';
import parseCSV from 'papaparse';
import { useIntl } from 'react-intl';
import { CSVRow } from '../../common/utils/csvUtils';
import {
  AssortmentCSVFileKey,
  AssortmentImportPayload,
  FileConfig,
} from '../types';
import { ASSORTMENT_CSV_SCHEMA } from '../hooks/useAssortmentExport';

const REQUIRED_FIELDS: Record<AssortmentCSVFileKey, string[]> = {
  assortmentCSV: ASSORTMENT_CSV_SCHEMA.base,
  assortmentChildrenCSV: ASSORTMENT_CSV_SCHEMA.assortmentChildrenFields,
  assortmentFiltersCSV: ASSORTMENT_CSV_SCHEMA.assortmentFilterFields,
  assortmentProductsCSV: ASSORTMENT_CSV_SCHEMA.assortmentProductFields,
};

const AssortmentImportForm = ({
  onImport,
}: {
  onImport: (files: AssortmentImportPayload) => Promise<void>;
}) => {
  const fileRefs = useRef<
    Partial<Record<AssortmentCSVFileKey, HTMLInputElement>>
  >({});
  const [errors, setErrors] = useState<
    Partial<Record<AssortmentCSVFileKey, string>>
  >({});
  const [fileData, setFileData] = useState<AssortmentImportPayload>({
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

  const validateCSV = (key: AssortmentCSVFileKey, rows: CSVRow[]) => {
    if (!rows.length) return false;

    const headers = Object.keys(rows[0]);
    const missing = REQUIRED_FIELDS[key].filter(
      (field) => !headers.includes(field),
    );

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

  const handleFileChange = async (key: AssortmentCSVFileKey, file?: File) => {
    if (!file) return;
    const data = await parseFile(file);
    const isValid = validateCSV(key, data);

    if (isValid) {
      setFileData((prev) => ({ ...prev, [key]: data }));
    } else {
      setFileData((prev) => ({ ...prev, [key]: [] }));
    }
  };

  const handleInputChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    key: AssortmentCSVFileKey,
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
  const hasErrors = Object.values(errors).some(Boolean);

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
          {errors[key] && (
            <p className="text-xs text-red-600 mt-1">{errors[key]}</p>
          )}
        </React.Fragment>
      ))}

      <Button
        text={
          isImporting
            ? formatMessage({ id: 'importing', defaultMessage: 'Importing...' })
            : formatMessage({ id: 'import', defaultMessage: 'Import' })
        }
        onClick={handleImport}
        disabled={isImporting || !isBaseSelected || hasErrors}
        variant="primary"
        className="w-full"
      />

      {isBaseSelected && !hasErrors && (
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
