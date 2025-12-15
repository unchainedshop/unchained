import React, { useCallback, useRef, useState } from 'react';
import Button from '../../common/components/Button';
import parseCSV from 'papaparse';
import { useIntl } from 'react-intl';
import { CSVRow, downloadCSV } from '../../common/utils/csvUtils';
import {
  buildFilterHeaders,
  buildFilterOptionHeaders,
  FILTER_CSV_SCHEMA,
} from '../hooks/useFilterExport';
import { CSVFileKey, FileConfig, FilterImportPayload } from '../types';
import useApp from '../../common/hooks/useApp';

const REQUIRED_FIELDS: Record<CSVFileKey, string[]> = {
  filtersCSV: FILTER_CSV_SCHEMA.filterFields,
  optionsCSV: FILTER_CSV_SCHEMA.optionFields,
};

export const getFilterCSVHeaders = (
  key: CSVFileKey,
  locales: string[] = [],
) => {
  if (key === 'filtersCSV') return buildFilterHeaders(locales);
  if (key === 'optionsCSV') return buildFilterOptionHeaders(locales);
  return [];
};

const downloadCSVTemplate = (
  key: CSVFileKey,
  fileName: string,
  locales: string[] = [],
) => {
  const headers = getFilterCSVHeaders(key, locales).join(',');
  downloadCSV(headers, fileName);
};

const FilterImportForm = ({
  onImport,
}: {
  onImport: (payload: FilterImportPayload) => Promise<void>;
}) => {
  const fileRefs = useRef<Partial<Record<CSVFileKey, HTMLInputElement>>>({});
  const { languageDialectList } = useApp();
  const locales = languageDialectList?.map((l) => l.isoCode) || [];

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
    const result = parseCSV.parse(text, { header: true, skipEmptyLines: true });
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
    setFileData((prev) => ({ ...prev, [key]: isValid ? data : [] }));
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
    <div className="max-w-md mx-auto p-6 bg-white border border-gray-200 rounded-lg shadow-md flex flex-col gap-6">
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
              disabled={isImporting || (!isBaseSelected && optional)}
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
        disabled={isImporting || !isBaseSelected || hasErrors}
        variant="primary"
        className="w-full flex justify-center items-center gap-2"
      >
        {isImporting && (
          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        )}
      </Button>

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
