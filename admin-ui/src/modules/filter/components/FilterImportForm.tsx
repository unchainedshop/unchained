import React, { useRef, useState } from 'react';
import Button from '../../common/components/Button';
import parseCSV from 'papaparse';
import { useIntl } from 'react-intl';
import { CSVRow } from '../../common/utils/csvUtils';

const FilterImportForm = ({ onImport }) => {
  const filtersFileRef = useRef<HTMLInputElement>(null);
  const optionsFileRef = useRef<HTMLInputElement>(null);
  const [filtersCSV, setFiltersCSV] = useState<CSVRow[]>([]);
  const [optionsCSV, setOptionsCSV] = useState<CSVRow[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const { formatMessage } = useIntl();

  const parseFile = async (file: File) => {
    const text = await file.text();
    const result = parseCSV.parse(text, { header: true, skipEmptyLines: true });
    return result.data as CSVRow[];
  };

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setData: React.Dispatch<React.SetStateAction<CSVRow[]>>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const data = await parseFile(file);
    setData(data);
    e.target.value = '';
  };

  const normalizeFiltersWithOptions = () => {
    const filterMap: Record<string, any> = {};
    filtersCSV.forEach((filter) => {
      filterMap[filter._id!] = { ...filter };
      const options = optionsCSV.filter(
        (option) => option['filterId'] === filter._id,
      );
      if (options.length) filterMap[filter._id!].options = options;
    });
    return Object.values(filterMap);
  };

  const handleImport = async () => {
    setIsImporting(true);
    try {
      const normalized = normalizeFiltersWithOptions();
      await onImport(normalized);
    } catch (err: any) {
      console.error('Error importing filters:', err);
    } finally {
      setIsImporting(false);
    }
  };

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

      <input
        ref={filtersFileRef}
        type="file"
        accept=".csv"
        onChange={(e) => handleFileChange(e, setFiltersCSV)}
        className="hidden"
      />
      <input
        ref={optionsFileRef}
        type="file"
        accept=".csv"
        onChange={(e) => handleFileChange(e, setOptionsCSV)}
        className="hidden"
      />

      <Button
        text={
          filtersCSV.length
            ? formatMessage({
                id: 'filters_file_selected',
                defaultMessage: 'Filters CSV Selected',
              })
            : formatMessage({
                id: 'select_filters_csv',
                defaultMessage: 'Select Filters CSV',
              })
        }
        onClick={() => filtersFileRef.current?.click()}
        variant="secondary"
        disabled={isImporting}
        className="w-full"
      />

      <Button
        text={
          optionsCSV.length
            ? formatMessage({
                id: 'options_file_selected',
                defaultMessage: 'Options CSV Selected',
              })
            : formatMessage({
                id: 'select_options_csv',
                defaultMessage: 'Select Filter Options CSV (Optional)',
              })
        }
        onClick={() => optionsFileRef.current?.click()}
        variant="secondary"
        disabled={isImporting}
        className="w-full"
      />

      <Button
        text={
          isImporting
            ? formatMessage({ id: 'importing', defaultMessage: 'Importing...' })
            : formatMessage({ id: 'import', defaultMessage: 'Import' })
        }
        onClick={handleImport}
        disabled={isImporting || !filtersCSV.length}
        variant="primary"
        className="w-full"
      />

      {filtersCSV.length > 0 && (
        <p className="text-center text-xs text-gray-500">
          {formatMessage(
            {
              id: 'ready_to_import',
              defaultMessage: 'Ready to import {filters} filters{options}.',
            },
            {
              filters: filtersCSV.length,
              options: optionsCSV.length
                ? ` with ${optionsCSV.length} options`
                : '',
            },
          )}
        </p>
      )}
    </div>
  );
};

export default FilterImportForm;
