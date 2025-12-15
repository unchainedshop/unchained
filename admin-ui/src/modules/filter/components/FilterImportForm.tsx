import React, { useCallback, useRef, useState } from 'react';
import Button from '../../common/components/Button';
import parseCSV from 'papaparse';
import { useIntl } from 'react-intl';
import { CSVRow } from '../../common/utils/csvUtils';
import { FILTER_CSV_SCHEMA } from '../hooks/useFilterExport';
import { CSVFileKey, FileConfig, FilterImportPayload } from '../types';

const REQUIRED_FIELDS: Record<CSVFileKey, string[]> = {
  filtersCSV: FILTER_CSV_SCHEMA.filterFields,
  optionsCSV: FILTER_CSV_SCHEMA.optionFields,
};

const FilterImportForm = ({
  onImport,
}: {
  onImport: (payload: FilterImportPayload) => Promise<void>;
}) => {
  const fileRefs = useRef<Partial<Record<CSVFileKey, HTMLInputElement>>>({});
  const [fileData, setFileData] = useState<FilterImportPayload>({
    filtersCSV: [],
    optionsCSV: [],
  });
  const [errors, setErrors] = useState<Partial<Record<CSVFileKey, string>>>({});
  const [isImporting, setIsImporting] = useState(false);
  const { formatMessage } = useIntl();

  const FILES: FileConfig[] = [
    {
      key: 'filtersCSV',
      label: formatMessage({
        id: 'filters_csv_file',
        defaultMessage: 'Filters CSV',
      }),
    },
    {
      key: 'optionsCSV',
      label: formatMessage({
        id: 'filter_options_csv_file',
        defaultMessage: 'Filter options CSV (Optional)',
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

  const validateCSV = (key: CSVFileKey, rows: CSVRow[]) => {
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

  const handleFileChange = async (key: CSVFileKey, file?: File) => {
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
      console.error('Error importing filters:', err);
    } finally {
      setIsImporting(false);
    }
  }, [fileData, onImport]);

  const isBaseSelected = fileData.filtersCSV.length > 0;
  const hasErrors = Object.values(errors).some(Boolean);

  return (
    <div className="max-w-md mx-auto p-6 bg-gray-50 border border-gray-200 rounded-lg flex flex-col gap-4">
      <h3 className="text-center text-lg font-semibold">
        {formatMessage({
          id: 'filter_import_title',
          defaultMessage: 'Import Filters',
        })}
      </h3>

      <p className="text-center text-sm text-gray-600">
        {formatMessage({
          id: 'filter_import_description',
          defaultMessage:
            'Select your filters CSV and optional filter options CSV, then click Import.',
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
              id: 'ready_to_import_filters',
              defaultMessage: 'Ready to import {filters} filters{options}.',
            },
            {
              filters: fileData.filtersCSV.length,
              options: fileData.optionsCSV.length
                ? ` with ${fileData.optionsCSV.length} options`
                : '',
            },
          )}
        </p>
      )}
    </div>
  );
};

export default FilterImportForm;
